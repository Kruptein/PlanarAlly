import json
from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import (
    ApiCampaignNote,
    ApiCoreNote,
    ApiLocationNote,
    ApiShapeNote,
)
from ..base import BaseDbModel
from ..typed import SelectSequence
from .location import Location
from .room import Room
from .shape import Shape
from .user import User

if TYPE_CHECKING:
    from .note_access import NoteAccess


class Note(BaseDbModel):
    access: SelectSequence["NoteAccess"]
    uuid = cast(str, TextField(primary_key=True))
    room = ForeignKeyField(Room, backref="notes", on_delete="CASCADE")
    location = ForeignKeyField(
        Location, null=True, backref="notes", on_delete="CASCADE"
    )
    user = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField())
    text = cast(str, TextField())
    kind = cast(str, TextField())
    tags = cast(str | None, TextField(null=True))
    shape = ForeignKeyField(Shape, backref="notes", null=True, on_delete="CASCADE")

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path()} - {self.user.name}"

    def as_pydantic(self):
        tags = json.loads(self.tags) if self.tags else []
        access = [a.as_pydantic() for a in self.access]
        core = ApiCoreNote(
            owner=self.user.name,
            uuid=self.uuid,
            title=self.title,
            text=self.text,
            tags=tags,
            access=access,
        )
        if self.kind == "campaign":
            return ApiCampaignNote(
                **core.dict(),
                kind=self.kind,
            )
        elif self.kind == "location":
            return ApiLocationNote(
                **core.dict(),
                kind=self.kind,
                location=self.location.id,
                shape=self.shape.id if self.shape else None,
            )
        elif self.kind == "shape":
            return ApiShapeNote(
                **core.dict(),
                kind=self.kind,
                shape=self.shape.id,
            )
