import json
from typing import cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from ..api.models.initiative import ApiInitiative
from . import Location
from .base import BaseModel

__all__ = ["Initiative"]


class Initiative(BaseModel):
    id: int

    location = cast(
        Location, ForeignKeyField(Location, backref="initiative", on_delete="CASCADE")
    )
    round = cast(int, IntegerField())
    turn = cast(int, IntegerField())
    sort = cast(int, IntegerField(default=0))
    data = cast(str, TextField())
    is_active = cast(bool, BooleanField(default=False))

    def as_dict(self):
        initiative = model_to_dict(
            self, recurse=False, exclude=[Initiative.id, Initiative.is_active]
        )
        initiative["data"] = json.loads(initiative["data"])
        initiative["isActive"] = self.is_active
        return initiative

    def as_pydantic(self):
        return ApiInitiative(
            location=self.location.id,
            round=self.round,
            turn=self.turn,
            sort=self.sort,
            data=json.loads(self.data),
            isActive=self.is_active,
        )
