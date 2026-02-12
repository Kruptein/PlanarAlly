from typing import TYPE_CHECKING, cast

from peewee import DeferredForeignKey

from ..base import BaseDbModel

if TYPE_CHECKING:
    from .note import Note
    from .shape import Shape


class NoteShape(BaseDbModel):
    note_id: str
    shape_id: str

    note = cast(
        "Note", DeferredForeignKey("Note", deferrable="INITIALLY DEFERRED", backref="shapes", on_delete="CASCADE")
    )
    shape = cast(
        "Shape",
        DeferredForeignKey("Shape", deferrable="INITIALLY DEFERRED", backref="notes", on_delete="CASCADE"),
    )
