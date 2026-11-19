import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from ..config import cfg
from ..db.models.stats import Stats, StatsKind
from .anonymize import anonymize

RECONNECT_GRACE_PERIOD = timedelta(minutes=5)
# The client reports itself idle after this long without user input (e.g. a forgotten tab),
# this has to match the timeout used by the client.
IDLE_TIMEOUT = timedelta(minutes=30)
# Idle disconnects include the idle time, so that whoever reads the stats doesn't need to know the timeout
IDLE_DATA = json.dumps({"idleSeconds": int(IDLE_TIMEOUT.total_seconds())})


def get_idle_time(data: str | None) -> timedelta | None:
    """Returns the idle time stored in the data of an idle disconnect"""
    if data is None:
        return None
    try:
        seconds = json.loads(data).get("idleSeconds")
    except (ValueError, AttributeError):
        return None
    return timedelta(seconds=seconds) if isinstance(seconds, int | float) else None


@dataclass
class _Activity:
    campaign_id: int
    player_id: int
    session_id: str
    idle: bool = False


_activity: dict[str, _Activity] = {}


def campaign_created(campaign_id: int, user_id: int):
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.CAMPAIGN_CREATED, campaign_id=anonymize(campaign_id), user_id=anonymize(user_id))


def _record_connect(activity: _Activity, *, merge_reconnect: bool):
    c_id = anonymize(activity.campaign_id)
    p_id = anonymize(activity.player_id)

    if merge_reconnect:
        # If this player recently disconnected from this campaign (e.g. a page reload), the old session is continued
        # by deleting its disconnect, in order to reduce noise in the data.
        # Idle disconnects are not merged, as that would count the idle time after all.
        last_event = (
            Stats.select()
            .where(
                Stats.kind.in_([StatsKind.USER_GAME_CONNECTED, StatsKind.USER_GAME_DISCONNECTED]),
                Stats.campaign_id == c_id,
                Stats.user_id == p_id,
            )
            .order_by(Stats.timestamp.desc())  # type: ignore
            .get_or_none()
        )
        if (
            last_event is not None
            and str(last_event.kind) == str(StatsKind.USER_GAME_DISCONNECTED)
            and get_idle_time(last_event.data) is None
            and last_event.session_id is not None
            and datetime.now(tz=UTC) - last_event.timestamp <= RECONNECT_GRACE_PERIOD
        ):
            activity.session_id = last_event.session_id
            last_event.delete_instance()
            return

    Stats.create(kind=StatsKind.USER_GAME_CONNECTED, campaign_id=c_id, user_id=p_id, session_id=activity.session_id)


def _record_disconnect(activity: _Activity, *, idle: bool):
    connect_event = Stats.get_or_none(
        Stats.kind == StatsKind.USER_GAME_CONNECTED, Stats.session_id == activity.session_id
    )
    # We only care about sessions that last at least 60 seconds
    if connect_event is not None and datetime.now(tz=UTC) - connect_event.timestamp < timedelta(seconds=60):
        connect_event.delete_instance()
        return

    # An idle disconnect is recorded when the idleness is detected, so that it is not missed by an export.
    # It is marked so that the idle time can be left out when calculating session lengths.
    Stats.create(
        kind=StatsKind.USER_GAME_DISCONNECTED,
        campaign_id=anonymize(activity.campaign_id),
        user_id=anonymize(activity.player_id),
        session_id=activity.session_id,
        data=IDLE_DATA if idle else None,
    )


def campaign_opened(campaign_id: int, player_id: int, sid: str):
    if not cfg().stats.enabled:
        return

    activity = _Activity(campaign_id, player_id, uuid4().hex)
    _activity[sid] = activity
    _record_connect(activity, merge_reconnect=True)


def campaign_closed(sid: str):
    activity = _activity.pop(sid, None)
    # No session was started if stats were disabled when connecting,
    # and an idle session was already closed when it went idle
    if activity is None or activity.idle or not cfg().stats.enabled:
        return

    _record_disconnect(activity, idle=False)


def player_idle(sid: str):
    activity = _activity.get(sid)
    if activity is None or activity.idle:
        return

    activity.idle = True
    if cfg().stats.enabled:
        _record_disconnect(activity, idle=True)


def player_active(sid: str):
    activity = _activity.get(sid)
    if activity is None or not activity.idle:
        return

    activity.idle = False
    activity.session_id = uuid4().hex
    if cfg().stats.enabled:
        _record_connect(activity, merge_reconnect=False)


def user_created(user_id: int):
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.USER_CREATED, user_id=anonymize(user_id))


def server_started():
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.SERVER_STARTED)


def server_stopped():
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.SERVER_STOPPED)
