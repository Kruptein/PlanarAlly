import json
from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import ApiNote
from ..base import BaseDbModel
from ..typed import SelectSequence
from .location import Location
from .room import Room
from .user import User

if TYPE_CHECKING:
    from .note_access import NoteAccess
    from .note_shape import NoteShape


class Note(BaseDbModel):
    access: SelectSequence["NoteAccess"]
    shapes: SelectSequence["NoteShape"]
    room_id: int | None
    location_id: int | None

    uuid = cast(str, TextField(primary_key=True))
    creator = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField())
    text = cast(str, TextField())
    tags = cast(str | None, TextField(null=True))

    show_on_hover = cast(bool, TextField(default="false"))
    show_icon_on_shape = cast(bool, TextField(default="false"))

    room = cast(
        Room | None,
        ForeignKeyField(Room, null=True, backref="notes", on_delete="CASCADE"),
    )
    location = cast(
        Location | None,
        ForeignKeyField(Location, null=True, backref="notes", on_delete="CASCADE"),
    )

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path() if self.room else ''} - {self.creator.name}"

    def as_pydantic(self):
        tags = json.loads(self.tags) if self.tags else []
        access = [a.as_pydantic() for a in self.access]
        return ApiNote(
            uuid=self.uuid,
            creator=self.creator.name,
            title=self.title,
            text=self.text,
            tags=tags,
            showOnHover=self.show_on_hover,
            showIconOnShape=self.show_icon_on_shape,
            access=access,
            isRoomNote=self.room is not None,
            location=self.location_id,
            shapes=[s.shape.uuid for s in self.shapes],
        )
