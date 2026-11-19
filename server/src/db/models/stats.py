from datetime import datetime
from enum import Enum
from typing import cast

from peewee import IntegerField, TextField

from ..base import BaseDbModel
from ..fields import UtcDateTimeField, utc_now


class StatsKind(Enum):
    CAMPAIGN_CREATED = "campaignCreated"
    SERVER_STARTED = "serverStarted"
    SERVER_STOPPED = "serverStopped"
    USER_CREATED = "userCreated"
    USER_GAME_CONNECTED = "userGameConnected"
    USER_GAME_DISCONNECTED = "userGameDisconnected"


class Stats(BaseDbModel):
    kind = cast(StatsKind, TextField())
    timestamp = cast(datetime, UtcDateTimeField(default=utc_now))
    data = cast(str | None, TextField(null=True))
    # If relevant, the campaign that it applied to
    campaign_id = cast(int | None, IntegerField(null=True))
    # If relevant, the user that it applied to
    user_id = cast(int | None, IntegerField(null=True))
    # Links the connect and disconnect events of a single game session
    session_id = cast(str | None, TextField(null=True))

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = (
            (("timestamp",), False),
            (("campaign_id", "user_id", "timestamp"), False),
            (("session_id",), False),
        )

    def to_export_format(self):
        return {
            "kind": self.kind,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "campaign_id": self.campaign_id,
            "user_id": self.user_id,
            "session_id": self.session_id,
        }
