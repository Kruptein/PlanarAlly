from datetime import datetime, timedelta

from ..config import cfg
from ..db.models.stats import Stats, StatsKind
from .anonymize import anonymize


def campaign_created(campaign_id: int, user_id: int):
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.CAMPAIGN_CREATED, campaign_id=anonymize(campaign_id), user_id=anonymize(user_id))


def campaign_opened(campaign_id: int, player_id: int):
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.USER_GAME_CONNECTED, campaign_id=anonymize(campaign_id), user_id=anonymize(player_id))


def campaign_closed(campaign_id: int, player_id: int):
    if not cfg().stats.enabled:
        return

    c_id = anonymize(campaign_id)
    p_id = anonymize(player_id)

    connect_event = (
        Stats.select()
        .where(Stats.kind == StatsKind.USER_GAME_CONNECTED, Stats.campaign_id == c_id, Stats.user_id == p_id)
        .order_by(Stats.timestamp.desc())  # type: ignore
        .get_or_none()
    )
    # We only care about connect/disconnect events if the connection stays open for at least 60 seconds
    if connect_event is not None and connect_event.timestamp - datetime.now() < timedelta(seconds=60):
        connect_event.delete_instance()
    else:
        Stats.create(kind=StatsKind.USER_GAME_DISCONNECTED, campaign_id=c_id, user_id=p_id)


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
