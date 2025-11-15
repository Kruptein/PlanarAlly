from typing import TYPE_CHECKING, cast

from peewee import DeferredForeignKey

from ..base import BaseDbModel

if TYPE_CHECKING:
    from .note import Note
    from .note_user_tag import NoteUserTag


class NoteTag(BaseDbModel):
    note_id: str
    tag_id: int

    tag = cast(
        "NoteUserTag",
        DeferredForeignKey("NoteUserTag", deferrable="INITIALLY DEFERRED", backref="note_tags", on_delete="CASCADE"),
    )
    note = cast(
        "Note", DeferredForeignKey("Note", deferrable="INITIALLY DEFERRED", backref="tags", on_delete="CASCADE")
    )

    class Meta:
        indexes = ((("note_id", "tag_id"), True),)
