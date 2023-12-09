import json
from typing import Literal, cast

from peewee import ForeignKeyField, TextField

from ...api.models.note import ApiCampaignNote, ApiLocationNote, ApiShapeNote
from ..base import BaseDbModel
from .location import Location
from .room import Room
from .shape import Shape
from .user import User


class Note(BaseDbModel):
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
    # private / public / mixed (if mixed, NoteAccess is used)
    access: Literal["private", "public", "mixed"] = cast(
        Literal["private", "public", "mixed"], TextField()
    )
    shape = ForeignKeyField(Shape, backref="notes", null=True, on_delete="CASCADE")

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path()} - {self.user.name}"

    def as_pydantic(self):
        tags = json.loads(self.tags) if self.tags else []
        if self.kind == "campaign":
            return ApiCampaignNote(
                uuid=self.uuid,
                kind=self.kind,
                title=self.title,
                text=self.text,
                tags=tags,
                access=self.access,
            )
        elif self.kind == "location":
            return ApiLocationNote(
                uuid=self.uuid,
                kind=self.kind,
                title=self.title,
                text=self.text,
                tags=tags,
                access=self.access,
                location=self.location.id,
                shape=self.shape.id if self.shape else None,
            )
        elif self.kind == "shape":
            return ApiShapeNote(
                uuid=self.uuid,
                kind=self.kind,
                title=self.title,
                text=self.text,
                tags=tags,
                access=self.access,
                shape=self.shape.id,
            )
