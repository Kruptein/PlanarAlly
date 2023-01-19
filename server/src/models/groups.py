from typing import TYPE_CHECKING, cast
from uuid import uuid4

from peewee import TextField

from ..api.models.floor import ApiGroup
from .base import BaseModel
from .typed import SelectSequence

if TYPE_CHECKING:
    from .shape import Shape


class Group(BaseModel):
    members: SelectSequence["Shape"]

    uuid = cast(str, TextField(primary_key=True))
    character_set = cast(str, TextField(default="0,1,2,3,4,5,6,7,8,9"))
    creation_order = cast(str, TextField(default="incrementing"))

    def make_copy(self):
        return Group.create(
            uuid=uuid4(),
            character_set=self.character_set,
            creation_order=self.creation_order,
        )

    def as_pydantic(self) -> ApiGroup:
        return ApiGroup(
            uuid=self.uuid,
            character_set=self.character_set,
            creation_order=self.creation_order,
        )
