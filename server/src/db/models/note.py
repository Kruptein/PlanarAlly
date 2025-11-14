from typing import cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import ApiNote
from ..base import BaseDbModel
from ..typed import SelectSequence
from .note_access import NoteAccess
from .note_room import NoteRoom
from .note_shape import NoteShape
from .note_tag import NoteTag
from .user import User


class Note(BaseDbModel):
    access: SelectSequence["NoteAccess"]
    rooms: SelectSequence["NoteRoom"]
    shapes: SelectSequence["NoteShape"]
    tags: SelectSequence["NoteTag"]

    uuid = cast(str, TextField(primary_key=True))
    creator = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField())
    text = cast(str, TextField())

    show_on_hover = cast(bool, TextField(default="false"))
    show_icon_on_shape = cast(bool, TextField(default="false"))

    def __repr__(self):
        return f"<Note {self.title} - {self.creator.name}"

    def as_pydantic(self):
        tags = [t.tag.tag for t in self.tags]
        access = [a.as_pydantic() for a in self.access]
        rooms = [r.as_pydantic() for r in self.rooms]
        return ApiNote(
            uuid=self.uuid,
            creator=self.creator.name,
            title=self.title,
            text=self.text,
            tags=tags,
            showOnHover=self.show_on_hover,
            showIconOnShape=self.show_icon_on_shape,
            access=access,
            rooms=rooms,
            shapes=[s.shape.uuid for s in self.shapes],
        )
