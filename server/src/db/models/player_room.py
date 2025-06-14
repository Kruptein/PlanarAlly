from datetime import date
from typing import Optional, cast

from peewee import DateField, ForeignKeyField, IntegerField, TextField

from ..base import BaseDbModel
from .location import Location
from .room import Room
from .user import User, UserOptions


class PlayerRoom(BaseDbModel):
    id: int

    role = cast(int, IntegerField(default=0))
    player = cast(User, ForeignKeyField(User, backref="rooms_joined", on_delete="CASCADE"))
    room = cast(Room, ForeignKeyField(Room, backref="players", on_delete="CASCADE"))
    active_location = cast(Location, ForeignKeyField(Location, backref="players", on_delete="CASCADE"))
    user_options = cast(
        Optional[UserOptions],
        ForeignKeyField(UserOptions, on_delete="CASCADE", null=True),
    )
    notes = TextField(null=True)
    last_played = cast(Optional[date], DateField(null=True))

    def __repr__(self):
        return f"<PlayerRoom {self.room.get_path()} - {self.player.name}>"
