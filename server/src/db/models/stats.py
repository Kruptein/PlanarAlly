from datetime import datetime
from enum import Enum
from typing import cast

from peewee import DateTimeField, TextField

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

    def to_export_format(self):
        return {
            "kind": self.kind,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
        }
