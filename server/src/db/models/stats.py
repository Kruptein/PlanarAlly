from datetime import datetime
from enum import Enum
from typing import cast

from peewee import DateTimeField, IntegerField, TextField

from ..base import BaseDbModel


class StatsKind(Enum):
    CAMPAIGN_CREATED = "campaignCreated"
    SERVER_STARTED = "serverStarted"
    SERVER_STOPPED = "serverStopped"
    USER_CREATED = "userCreated"
    USER_GAME_CONNECTED = "userGameConnected"
    USER_GAME_DISCONNECTED = "userGameDisconnected"


class Stats(BaseDbModel):
    kind = cast(StatsKind, TextField())
    timestamp = cast(datetime, DateTimeField(default=datetime.now))
    data = cast(str | None, TextField(null=True))
    # If relevant, the campaign that it applied to
    campaign_id = cast(int | None, IntegerField(null=True))
    # If relevant, the user that it applied to
    user_id = cast(int | None, IntegerField(null=True))

    def to_export_format(self):
        return {
            "kind": self.kind,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "campaign_id": self.campaign_id,
            "user_id": self.user_id,
        }
