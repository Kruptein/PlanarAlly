from __future__ import annotations

from typing import cast
from uuid import uuid4

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ...api.models.tracker import ApiTracker
from ..base import BaseDbModel
from .shape import Shape


class Tracker(BaseDbModel):
    uuid = cast(str, TextField(primary_key=True))
    shape = cast(Shape, ForeignKeyField(Shape, backref="trackers", on_delete="CASCADE"))
    visible = cast(bool, BooleanField())
    name = cast(str, TextField())
    value = cast(int, IntegerField())
    maxvalue = cast(int, IntegerField())
    draw = cast(bool, BooleanField())
    primary_color = cast(str, TextField())
    secondary_color = cast(str, TextField())

    def __repr__(self):
        return f"<Tracker {self.name} {self.shape.get_path()}>"

    def as_pydantic(self):
        return ApiTracker(
            uuid=self.uuid,
            shape=self.shape.uuid,
            visible=self.visible,
            name=self.name,
            value=self.value,
            maxvalue=self.maxvalue,
            draw=self.draw,
            primary_color=self.primary_color,
            secondary_color=self.secondary_color,
        )

    def make_copy(self, new_shape):
        _dict = self.as_pydantic()
        _dict.uuid = str(uuid4())
        _dict.shape = new_shape
        type(self).create(**_dict.model_dump())
