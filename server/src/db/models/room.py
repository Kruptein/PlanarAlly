import uuid
from typing import TYPE_CHECKING, Optional, cast

from peewee import BooleanField, ForeignKeyField, TextField

from ..base import BaseDbModel
from ..typed import SelectSequence
from .asset import Asset
from .location_options import LocationOptions
from .user import User

if TYPE_CHECKING:
    from .location import Location
    from .player_room import PlayerRoom


class Room(BaseDbModel):
    id: int
    logo_id: Optional[int]
    players: SelectSequence["PlayerRoom"]
    locations: SelectSequence["Location"]
    default_options: LocationOptions

    name = cast(str, TextField())
    creator = cast(
        User, ForeignKeyField(User, backref="rooms_created", on_delete="CASCADE")
    )
    invitation_code = cast(uuid.UUID, TextField(default=uuid.uuid4, unique=True))
    is_locked = cast(bool, BooleanField(default=False))
    default_options = cast(
        LocationOptions, ForeignKeyField(LocationOptions, on_delete="CASCADE")
    )
    logo = ForeignKeyField(Asset, null=True, on_delete="SET NULL")

    enable_chat = cast(bool, BooleanField(default=True))
    enable_dice = cast(bool, BooleanField(default=True))

    def __repr__(self):
        return f"<Room {self.get_path()}>"

    def get_path(self):
        return f"{self.creator.name}/{self.name}"

    def as_dashboard_dict(self):
        logo = None
        if self.logo_id is not None:
            logo = self.logo.file_hash
        return {
            "name": self.name,
            "creator": self.creator.name,
            "is_locked": self.is_locked,
            "logo": logo,
        }

    class Meta:
        indexes = ((("name", "creator"), True),)
