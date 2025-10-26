from typing import cast
from uuid import uuid4

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ...api.models.aura import ApiAura
from ..base import BaseDbModel
from .shape import Shape


class Aura(BaseDbModel):
    uuid = cast(str, TextField(primary_key=True))
    shape = cast(Shape, ForeignKeyField(Shape, backref="auras", on_delete="CASCADE"))
    vision_source = cast(bool, BooleanField())
    visible = cast(bool, BooleanField())
    name = cast(str, TextField())
    value = cast(int, IntegerField())
    dim = cast(int, IntegerField())
    colour = cast(str, TextField())
    active = cast(bool, BooleanField())
    border_colour = cast(str, TextField())
    angle = cast(int, IntegerField())
    direction = cast(int, IntegerField())

    def __repr__(self):
        return f"<Aura {self.name} {self.shape.get_path()}>"

    def as_pydantic(self):
        return ApiAura(
            uuid=self.uuid,
            shape=self.shape.uuid,
            vision_source=self.vision_source,
            visible=self.visible,
            name=self.name,
            value=self.value,
            dim=self.dim,
            colour=self.colour,
            active=self.active,
            border_colour=self.border_colour,
            angle=self.angle,
            direction=self.direction,
        )

    def make_copy(self, new_shape):
        _dict = self.as_pydantic()
        _dict.uuid = str(uuid4())
        _dict.shape = new_shape
        type(self).create(**_dict.model_dump())
