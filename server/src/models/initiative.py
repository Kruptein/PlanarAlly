import json
from typing import cast

from peewee import ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from . import Location
from .base import BaseModel


__all__ = ["Initiative"]


class Initiative(BaseModel):
    id: int

    location = ForeignKeyField(Location, backref="initiative", on_delete="CASCADE")
    round = IntegerField()
    turn = cast(int, IntegerField())
    sort = IntegerField(default=0)
    data = cast(str, TextField())

    def as_dict(self):
        initiative = model_to_dict(self, recurse=False, exclude=[Initiative.id])
        initiative["data"] = json.loads(initiative["data"])
        return initiative
