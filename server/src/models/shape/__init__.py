from __future__ import annotations

from typing import cast
from uuid import uuid4

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ...api.models.aura import ApiAura
from ...api.models.shape.owner import ApiShapeOwner
from ...api.models.tracker import ApiTracker
from ..base import BaseModel
from ..label import Label
from ..user import User
from .shape import Shape
from .subtypes import (
    AssetRect,
    Circle,
    CircularToken,
    Line,
    Polygon,
    Rect,
    Text,
    ToggleComposite,
)

__all__ = [
    "AssetRect",
    "Aura",
    "Circle",
    "CircularToken",
    "Line",
    "Polygon",
    "Rect",
    "Shape",
    "ShapeLabel",
    "ShapeOwner",
    "Text",
    "ToggleComposite",
    "Tracker",
]


class ShapeLabel(BaseModel):
    shape = ForeignKeyField(Shape, backref="labels", on_delete="CASCADE")
    label = ForeignKeyField(Label, backref="shapes", on_delete="CASCADE")

    def make_copy(self, shape):
        ShapeLabel.create(shape=shape, label=self.label.make_copy())


class Tracker(BaseModel):
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
        type(self).create(shape=new_shape, **_dict.dict())


class Aura(BaseModel):
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
        type(self).create(shape=new_shape, **_dict.dict())


class ShapeOwner(BaseModel):
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
        _dict = self.as_pydantic().dict()
        _dict["shape"] = new_shape.uuid
        _dict["user"] = self.user
        type(self).create(**_dict)
