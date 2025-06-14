from typing import cast

from peewee import BooleanField, ForeignKeyField

from ..base import BaseDbModel
from .mod import Mod
from .player_room import PlayerRoom


class ModPlayerRoom(BaseDbModel):
    id: int

    mod = cast(Mod, ForeignKeyField(Mod, backref="mods_player_room", on_delete="CASCADE"))
    player_room = cast(
        PlayerRoom,
        ForeignKeyField(PlayerRoom, backref="mods_player_room", on_delete="CASCADE"),
    )
    enabled = cast(bool, BooleanField(default=True))

    def __repr__(self):
        return (
            f"<ModPR {self.mod.tag}-{self.mod.version} - {self.player_room.room.name} - {self.player_room.player.name}>"
        )
