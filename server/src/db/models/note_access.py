from typing import TYPE_CHECKING, cast

from peewee import BooleanField, DeferredForeignKey, ForeignKeyField

from ...api.models.note import ApiNoteAccess
from ..base import BaseDbModel
from .user import User

if TYPE_CHECKING:
    from .note import Note


class NoteAccess(BaseDbModel):
    note_id: str

    note = cast(
        "Note", DeferredForeignKey("Note", deferrable="INITIALLY DEFERRED", backref="access", on_delete="CASCADE")
    )
    # User is null if the access is describing the default behaviour
    user = cast(
        User | None,
        ForeignKeyField(User, backref="note_access", null=True, on_delete="CASCADE"),
    )
    can_edit = cast(bool, BooleanField(default=False))
    can_view = cast(bool, BooleanField(default=False))

    def as_pydantic(self):
        user_name = "default" if self.user is None else self.user.name
        return ApiNoteAccess(name=user_name, can_edit=self.can_edit, can_view=self.can_view)
