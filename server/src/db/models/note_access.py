from typing import cast

from peewee import BooleanField, ForeignKeyField

from ...api.models.note import ApiNoteAccess
from ..base import BaseDbModel
from .note import Note
from .user import User


class NoteAccess(BaseDbModel):
    note = cast(Note, ForeignKeyField(Note, backref="access", on_delete="CASCADE"))
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
