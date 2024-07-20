from typing import cast

from peewee import ForeignKeyField

from ..base import BaseDbModel
from .note import Note
from .shape import Shape


class NoteShape(BaseDbModel):
    note = cast(Note, ForeignKeyField(Note, backref="shapes", on_delete="CASCADE"))
    shape = cast(
        Shape,
        ForeignKeyField(Shape, backref="notes", on_delete="CASCADE"),
    )
