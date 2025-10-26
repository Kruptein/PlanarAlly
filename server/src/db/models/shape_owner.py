from __future__ import annotations

from typing import cast

from peewee import BooleanField, ForeignKeyField

from ...api.models.shape.owner import ApiShapeOwner
from ..base import BaseDbModel
from .shape import Shape
from .user import User


class ShapeOwner(BaseDbModel):
    shape = cast(Shape, ForeignKeyField(Shape, backref="owners", on_delete="CASCADE"))
    user = cast(User, ForeignKeyField(User, backref="shapes", on_delete="CASCADE"))
    edit_access = cast(bool, BooleanField())
    vision_access = cast(bool, BooleanField())
    movement_access = cast(bool, BooleanField())

    def __repr__(self):
        return f"<ShapeOwner {self.user.name} {self.shape.get_path()}>"

    def as_pydantic(self) -> ApiShapeOwner:
        return ApiShapeOwner(
            shape=self.shape.uuid,
            user=self.user.name,
            edit_access=self.edit_access,
            movement_access=self.movement_access,
            vision_access=self.vision_access,
        )

    def make_copy(self, new_shape):
        _dict = self.as_pydantic().model_dump()
        _dict["shape"] = new_shape.uuid
        _dict["user"] = self.user
        type(self).create(**_dict)
