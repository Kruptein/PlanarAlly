from typing import cast

from peewee import BooleanField, ForeignKeyField

from ..base import BaseDbModel
from .mod import Mod
from .room import Room


class ModRoom(BaseDbModel):
    id: int

    mod = cast(Mod, ForeignKeyField(Mod, backref="mods_room", on_delete="CASCADE"))
    room = cast(
        Room,
        ForeignKeyField(Room, backref="mods_room", on_delete="CASCADE"),
    )
    enabled = cast(bool, BooleanField(default=True))

    def __repr__(self):
        return f"<ModR {self.mod.tag}-{self.mod.version} - {self.room.name}>"
