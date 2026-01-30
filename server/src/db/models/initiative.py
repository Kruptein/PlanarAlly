import json
from typing import cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField
from pydantic_core import MISSING

from ...api.models.initiative import ApiInitiative
from ..base import BaseDbModel
from .location import Location

from ...logs import logger

__all__ = ["Initiative"]


class Initiative(BaseDbModel):
    id: int

    location = cast(Location, ForeignKeyField(Location, backref="initiative", on_delete="CASCADE"))
    round = cast(int, IntegerField())
    turn = cast(int, IntegerField())
    sort = cast(int, IntegerField(default=0))
    data = cast(str, TextField())
    is_active = cast(bool, BooleanField(default=False))

    def as_pydantic(self):
        data = json.loads(self.data)
        for el in data:
            if "initiative" not in el or el["initiative"] is None:
                el["initiative"] = MISSING
        return ApiInitiative(
            location=self.location.id,
            round=self.round,
            turn=self.turn,
            sort=self.sort,
            data=data,
            isActive=self.is_active,
        )
