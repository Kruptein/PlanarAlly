import json
from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import ApiNote
from ..base import BaseDbModel
from ..typed import SelectSequence
from .room import Room
from .user import User

if TYPE_CHECKING:
    from .note_access import NoteAccess
    from .note_shape import NoteShape


class Note(BaseDbModel):
    access: SelectSequence["NoteAccess"]
    shapes: SelectSequence["NoteShape"]

    uuid = cast(str, TextField(primary_key=True))
    creator = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField())
    text = cast(str, TextField())
    tags = cast(str | None, TextField(null=True))
    room = cast(Room, ForeignKeyField(Room, backref="notes", on_delete="CASCADE"))

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path()} - {self.creator.name}"

    def as_pydantic(self):
        tags = json.loads(self.tags) if self.tags else []
        access = [a.as_pydantic() for a in self.access]
        return ApiNote(
            uuid=self.uuid,
            creator=self.creator.name,
            title=self.title,
            text=self.text,
            tags=tags,
            access=access,
            isRoomNote=self.room is not None,
            shapes=[s.shape.uuid for s in self.shapes],
        )
