from typing import cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import ApiNote
from ..base import BaseDbModel
from .location import Location
from .room import Room
from .user import User


class Note(BaseDbModel):
    uuid = cast(str, TextField(primary_key=True))
    room = ForeignKeyField(Room, backref="notes", on_delete="CASCADE")
    location = ForeignKeyField(
        Location, null=True, backref="notes", on_delete="CASCADE"
    )
    user = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField(null=True))
    text = cast(str, TextField(null=True))

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path()} - {self.user.name}"

    def as_pydantic(self):
        return ApiNote(uuid=self.uuid, title=self.title, text=self.text)
