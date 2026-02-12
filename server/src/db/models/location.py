from typing import TYPE_CHECKING, cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ...api.models.location import ApiLocation, ApiOptionalLocationOptions
from ..base import BaseDbModel
from ..typed import SelectSequence
from .location_options import LocationOptions
from .room import Room

if TYPE_CHECKING:
    from .floor import Floor
    from .initiative import Initiative
    from .location_user_option import LocationUserOption
    from .marker import Marker
    from .player_room import PlayerRoom


class Location(BaseDbModel):
    id: int
    room_id: int
    floors: SelectSequence["Floor"]
    initiative: list["Initiative"]
    markers: SelectSequence["Marker"]
    players: SelectSequence["PlayerRoom"]
    user_options: list["LocationUserOption"]

    room = ForeignKeyField(Room, backref="locations", on_delete="CASCADE")
    name = cast(str, TextField())
    options = cast(
        LocationOptions | None,
        ForeignKeyField(LocationOptions, on_delete="CASCADE", null=True),
    )
    index = cast(int, IntegerField())
    archived = cast(bool, BooleanField(default=False))

    def __repr__(self):
        return f"<Location {self.get_path()}>"

    def get_path(self):
        return f"{self.room.get_path()}/{self.name}"

    def as_pydantic(self):
        if self.options is not None:
            options = self.options.as_pydantic(True)
        else:
            options = ApiOptionalLocationOptions(spawn_locations="[]")
        return ApiLocation(id=self.id, name=self.name, options=options, archived=self.archived)
