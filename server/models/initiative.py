import json
from peewee import ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from . import Location
from .base import BaseModel


__all__ = ["Initiative"]


class Initiative(BaseModel):
    location = ForeignKeyField(Location, backref="initiative", on_delete="CASCADE")
    round = IntegerField()
    turn = IntegerField()
    sort = IntegerField(default=0)
    data = TextField()

    def as_dict(self):
        initiative = model_to_dict(self, recurse=False, exclude=[Initiative.id])
        initiative["data"] = json.loads(initiative["data"])
        return initiative
