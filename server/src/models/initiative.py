import json
from typing import cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from . import Location
from .base import BaseModel


__all__ = ["Initiative"]


class Initiative(BaseModel):
    id: int

    location = ForeignKeyField(Location, backref="initiative", on_delete="CASCADE")
    round = IntegerField()
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
