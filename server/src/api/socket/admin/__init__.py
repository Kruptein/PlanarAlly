import secrets
from datetime import datetime, timedelta
from uuid import uuid4

from .... import stats
from ....api.models.notification import NotificationShow
from ....api.socket.constants import ADMIN_NS
from ....app import sio
from ....auth import get_authorized_user
from ....config import cfg
from ....db.db import db
from ....db.models.constants import Constants
from ....db.models.notification import Notification
from ....db.models.player_room import PlayerRoom
from ....db.models.room import Room
from ....db.models.stats import Stats, StatsKind
from ....db.models.user import User
from ....logs import logger
from ....state.admin import admin_state


def is_admin(user: User) -> bool:
    return user.name == cfg().general.admin_user


@sio.on("connect", namespace=ADMIN_NS)
async def admin_connect(sid: str, environ):
    user = await get_authorized_user(environ["aiohttp.request"])
    if user is None:
        await sio.disconnect(sid, ADMIN_NS)
        return
    elif not is_admin(user):
        await sio.disconnect(sid, ADMIN_NS)
        return

    await admin_state.add_sid(sid, user)

    await send_notifications(sid)


@sio.on("disconnect", namespace=ADMIN_NS)
async def disconnect(sid):
    if not admin_state.has_sid(sid):
        return

    await admin_state.remove_sid(sid)


async def send_notifications(sid):
    notifications = Notification.select()

    data = [NotificationShow(uuid=str(n.uuid), message=n.message) for n in notifications]

    await sio.emit("Notifications.List", data, to=sid, namespace=ADMIN_NS)


@sio.on("Stats.Overview", namespace=ADMIN_NS)
async def stats_overview(sid: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    now = datetime.now()
    activity_cutoff = now - timedelta(days=30)
    first_chart_day = (now - timedelta(days=13)).date()
    chart_cutoff = datetime.combine(first_chart_day, datetime.min.time())

    def count_events(kind: StatsKind) -> int:
        return Stats.select().where(Stats.kind == kind, Stats.timestamp >= activity_cutoff).count()

    daily_activity = {
        (first_chart_day + timedelta(days=offset)).isoformat(): {
            "date": (first_chart_day + timedelta(days=offset)).isoformat(),
            "newUsers": 0,
            "newCampaigns": 0,
            "activeCampaigns": 0,
            "connectedPlayers": 0,
            "sessions": 0,
        }
        for offset in range(14)
    }
    campaigns_by_day: dict[str, set[str]] = {day: set() for day in daily_activity}
    players_by_day: dict[str, set[str]] = {day: set() for day in daily_activity}
    events = Stats.select(Stats.kind, Stats.timestamp, Stats.campaign_id, Stats.user_id).where(
        Stats.timestamp >= chart_cutoff,
        Stats.kind.in_(
            [
                StatsKind.USER_CREATED,
                StatsKind.CAMPAIGN_CREATED,
                StatsKind.USER_GAME_CONNECTED,
            ]
        ),
    )
    for event in events:
        day = event.timestamp.date().isoformat()
        if day not in daily_activity:
            continue

        if str(event.kind) == str(StatsKind.USER_CREATED):
            daily_activity[day]["newUsers"] += 1
            continue
        if str(event.kind) == str(StatsKind.CAMPAIGN_CREATED):
            daily_activity[day]["newCampaigns"] += 1
            continue

        daily_activity[day]["sessions"] += 1
        if event.campaign_id is not None:
            campaigns_by_day[day].add(str(event.campaign_id))
        if event.user_id is not None:
            players_by_day[day].add(str(event.user_id))

    for day, activity in daily_activity.items():
        activity["activeCampaigns"] = len(campaigns_by_day[day])
        activity["connectedPlayers"] = len(players_by_day[day])

    latest_start = (
        Stats.select()
        .where(Stats.kind == StatsKind.SERVER_STARTED)
        .order_by(Stats.timestamp.desc())  # type: ignore
        .first()
    )
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
            "newUsers": count_events(StatsKind.USER_CREATED),
            "newCampaigns": count_events(StatsKind.CAMPAIGN_CREATED),
            "sessions": count_events(StatsKind.USER_GAME_CONNECTED),
        },
        "telemetry": {
            "enabled": cfg().stats.enabled,
            "exportEnabled": cfg().stats.enable_export,
            "pendingEvents": pending_events.count(),
            "lastExport": constants.last_export_date.isoformat() if constants.last_export_date else None,
            "serverStarted": latest_start.timestamp.isoformat() if latest_start else None,
        },
        "dailyActivity": list(daily_activity.values()),
    }


@sio.on("Notifications.Add", namespace=ADMIN_NS)
async def add_notification(sid: str, message: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    Notification.create(uuid=uuid4(), message=message)

    await send_notifications(sid)


@sio.on("Users.List", namespace=ADMIN_NS)
async def list_users(sid: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    users = [
        {"name": u.name, "email": u.email, "lastLogin": u.last_login.isoformat() if u.last_login else None}
        for u in User.select()
    ]

    return users


@sio.on("Users.Reset", namespace=ADMIN_NS)
async def reset_user(sid: str, name: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    target_user = User.by_name(name)
    if target_user is None:
        return False
    new_pw = secrets.token_urlsafe(20)
    target_user.set_password(new_pw)
    target_user.save()
    return new_pw


@sio.on("Users.Remove", namespace=ADMIN_NS)
async def remove_user(sid: str, name: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    target_user = User.by_name(name)
    if target_user is None:
        return False
    try:
        target_user.delete_instance(recursive=True)
    except:
        return False
    return True


@sio.on("Users.Add", namespace=ADMIN_NS)
async def add_user(sid: str, name: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    target_user = User.by_name(name)
    if target_user is not None:
        return False

    try:
        pw = secrets.token_urlsafe(20)
        with db.atomic():
            new_user = User.create_new(name, pw)
            stats.events.user_created(new_user.id)
        return pw
    except:
        logger.exception("Error creating user")
        return False


@sio.on("Campaigns.List", namespace=ADMIN_NS)
async def list_campaigns(sid: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    rooms = Room.select()
    return [{"name": r.name, "creator": r.creator.name} for r in rooms]
