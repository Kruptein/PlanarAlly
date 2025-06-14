import json

from ..config import cfg
from ..db.models.stats import Stats, StatsKind
from .anonymize import anonymize


def campaign_created(campaign_id: int, user_id: int):
    if not cfg().stats.enabled:
        return

    data = {
        "campaignId": anonymize(campaign_id),
        "userId": anonymize(user_id),
    }
    Stats.create(kind=StatsKind.CAMPAIGN_CREATED, data=json.dumps(data))


def campaign_opened(campaign_id: int, player_id: int):
    if not cfg().stats.enabled:
        return

    data = {
        "campaignId": anonymize(campaign_id),
        "playerId": anonymize(player_id),
    }
    Stats.create(kind=StatsKind.USER_GAME_CONNECTED, data=json.dumps(data))


def campaign_closed(campaign_id: int, player_id: int):
    if not cfg().stats.enabled:
        return

    data = {
        "campaignId": anonymize(campaign_id),
        "playerId": anonymize(player_id),
    }
    Stats.create(kind=StatsKind.USER_GAME_DISCONNECTED, data=json.dumps(data))


def user_created(user_id: int):
    if not cfg().stats.enabled:
        return

    data = {
        "userId": anonymize(user_id),
    }
    Stats.create(kind=StatsKind.USER_CREATED, data=json.dumps(data))


def server_started():
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.SERVER_STARTED)


def server_stopped():
    if not cfg().stats.enabled:
        return

    Stats.create(kind=StatsKind.SERVER_STOPPED)
