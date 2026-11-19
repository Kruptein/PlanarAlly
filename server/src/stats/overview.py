from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from ..config import cfg
from ..db.models.constants import Constants
from ..db.models.player_room import PlayerRoom
from ..db.models.room import Room
from ..db.models.stats import Stats, StatsKind
from ..db.models.user import User
from .events import get_idle_time

ACTIVITY_DAYS = 30
CHART_DAYS = 14
MAX_UTC_OFFSET = timedelta(hours=14)


@dataclass
class Session:
    campaign_id: str
    user_id: str
    start: datetime
    end: datetime


def _is(event: Stats, kind: StatsKind) -> bool:
    return str(event.kind) == str(kind)


def _collect_sessions(events: list[Stats], now: datetime, server_started: datetime | None) -> list[Session]:
    """
    Pairs connect and disconnect events by their session id.

    Events from before session ids were recorded are paired with the next disconnect of the same player
    in the same campaign, a connect that is followed by another connect has no reliable end and is dropped.
    An idle connection gets a disconnect that includes the idle time, and a new session once it's active again.
    A connect without a disconnect is only still going if it happened after the last server start,
    otherwise the server stopped without recording the disconnect.
    """
    sessions: list[Session] = []
    open_sessions: dict[str | tuple[str, str], Stats] = {}
    for event in events:
        if event.campaign_id is None or event.user_id is None:
            continue
        key = event.session_id or (str(event.campaign_id), str(event.user_id))
        if _is(event, StatsKind.USER_GAME_CONNECTED):
            open_sessions[key] = event
        elif _is(event, StatsKind.USER_GAME_DISCONNECTED) and key in open_sessions:
            start = open_sessions.pop(key).timestamp
            end = event.timestamp
            # Idle disconnects are recorded once the timeout passed, the session really ended at the last activity
            idle_time = get_idle_time(event.data)
            if idle_time is not None:
                end = max(start, end - idle_time)
            sessions.append(Session(str(event.campaign_id), str(event.user_id), start=start, end=end))

    for connect in open_sessions.values():
        if server_started is not None and connect.timestamp >= server_started:
            sessions.append(Session(str(connect.campaign_id), str(connect.user_id), start=connect.timestamp, end=now))
    return sessions


def get_overview(utc_offset_minutes: int = 0) -> dict:
    """
    Aggregates the locally collected stats for the admin panel.

    Chart days are bucketed using the UTC offset of the admin's browser, so that they match the admin's local dates.
    """
    now = datetime.now(tz=UTC)
    offset = max(-MAX_UTC_OFFSET, min(MAX_UTC_OFFSET, timedelta(minutes=utc_offset_minutes)))

    def local_day(timestamp: datetime) -> date:
        return (timestamp + offset).date()

    activity_cutoff = now - timedelta(days=ACTIVITY_DAYS)
    first_chart_day = local_day(now) - timedelta(days=CHART_DAYS - 1)
    chart_days = [first_chart_day + timedelta(days=i) for i in range(CHART_DAYS)]

    latest_start = (
        Stats.select()
        .where(Stats.kind == StatsKind.SERVER_STARTED)
        .order_by(Stats.timestamp.desc())  # type: ignore
        .first()
    )
    server_started = latest_start.timestamp if latest_start else None

    events = list(
        Stats.select(Stats.kind, Stats.timestamp, Stats.campaign_id, Stats.user_id, Stats.session_id, Stats.data)
        .where(
            Stats.timestamp >= activity_cutoff,
            Stats.kind.in_(
                [
                    StatsKind.USER_CREATED,
                    StatsKind.CAMPAIGN_CREATED,
                    StatsKind.USER_GAME_CONNECTED,
                    StatsKind.USER_GAME_DISCONNECTED,
                ]
            ),
        )
        .order_by(Stats.timestamp, Stats.id)
    )
    sessions = _collect_sessions(events, now, server_started)

    daily = {
        day: {
            "date": day.isoformat(),
            "newUsers": 0,
            "newCampaigns": 0,
            "activeCampaigns": 0,
            "connectedPlayers": 0,
            "sessions": 0,
            "playTime": 0,
        }
        for day in chart_days
    }
    for event in events:
        day = daily.get(local_day(event.timestamp))
        if day is None:
            continue
        if _is(event, StatsKind.USER_CREATED):
            day["newUsers"] += 1
        elif _is(event, StatsKind.CAMPAIGN_CREATED):
            day["newCampaigns"] += 1

    # Sessions count towards the day they started on
    campaigns_by_day: dict[date, set[str]] = {day: set() for day in chart_days}
    players_by_day: dict[date, set[str]] = {day: set() for day in chart_days}
    for session in sessions:
        start_day = local_day(session.start)
        day = daily.get(start_day)
        if day is None:
            continue
        day["sessions"] += 1
        day["playTime"] += int((session.end - session.start).total_seconds())
        campaigns_by_day[start_day].add(session.campaign_id)
        players_by_day[start_day].add(session.user_id)
    for day, activity in daily.items():
        activity["activeCampaigns"] = len(campaigns_by_day[day])
        activity["connectedPlayers"] = len(players_by_day[day])

    play_time = sum(int((s.end - s.start).total_seconds()) for s in sessions)

    constants = Constants.get()
    pending_events = Stats.select()
    if constants.last_export_date is not None:
        pending_events = pending_events.where(Stats.timestamp > constants.last_export_date)

    return {
        "totals": {
            "users": User.select().count(),
            "campaigns": Room.select().count(),
            "memberships": PlayerRoom.select().count(),
            "activeUsers": User.select()
            .where(User.last_login >= activity_cutoff.date())  # type: ignore
            .count(),
        },
        "activity": {
            "newUsers": sum(1 for e in events if _is(e, StatsKind.USER_CREATED)),
            "newCampaigns": sum(1 for e in events if _is(e, StatsKind.CAMPAIGN_CREATED)),
            "sessions": len(sessions),
            "playTime": play_time,
            "averageSession": play_time // len(sessions) if sessions else 0,
        },
        "telemetry": {
            "enabled": cfg().stats.enabled,
            "exportEnabled": cfg().stats.enable_export,
            "pendingEvents": pending_events.count(),
            "lastExport": constants.last_export_date.isoformat() if constants.last_export_date else None,
            "serverStarted": server_started.isoformat() if server_started else None,
        },
        "dailyActivity": list(daily.values()),
    }
