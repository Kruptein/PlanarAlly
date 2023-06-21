from typing import TYPE_CHECKING, List, cast
from uuid import uuid4

from peewee import BooleanField, ForeignKeyField, TextField

from ...api.models.label import ApiLabel
from ..base import BaseDbModel
from .user import User

if TYPE_CHECKING:
    from .label_selection import LabelSelection


class Label(BaseDbModel):
    labelselection_set: List["LabelSelection"]

    uuid = cast(str, TextField(primary_key=True))
    user = ForeignKeyField(User, backref="labels", on_delete="CASCADE")
    category = cast(str, TextField(null=True))
    name = cast(str, TextField())
    visible = cast(bool, BooleanField())

    def as_pydantic(self):
        return ApiLabel(
            uuid=self.uuid,
            user=self.user.name,
            category=self.category,
            name=self.name,
            visible=self.visible,
        )

    def make_copy(self):
        return Label.create(
            uuid=str(uuid4()),
            user=self.user,
            category=self.category,
            name=self.name,
            visible=self.visible,
        )
