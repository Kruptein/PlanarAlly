from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField, TextField

from ..base import BaseDbModel
from ..typed import SelectSequence
from .user import User


if TYPE_CHECKING:
    from .note_tag import NoteTag


class NoteUserTag(BaseDbModel):
    id: int
    note_tags: SelectSequence["NoteTag"]
    user_id: int

    user = cast("User", ForeignKeyField(User, backref="note_tags", on_delete="CASCADE"))
    tag = cast(str, TextField())

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("user_id", "tag"), True),)
