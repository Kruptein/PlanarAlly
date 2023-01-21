from __future__ import annotations

import json
from typing import List, Optional, Tuple, cast

from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField

from ...api.models.shape import ApiShape
from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import (
    ApiAssetRectShape,
    ApiCircleShape,
    ApiCircularTokenShape,
    ApiLineShape,
    ApiPolygonShape,
    ApiRectShape,
    ApiTextShape,
    ApiToggleCompositeShape,
    ToggleVariant,
)
from ...logs import logger
from ..base import BaseModel
from .shape import Shape


class ShapeType(BaseModel):
    shape = ForeignKeyField(Shape, primary_key=True, on_delete="CASCADE")

    @staticmethod
    def pre_create(**kwargs):
        return kwargs

    @staticmethod
    def post_create(subshape, **kwargs):
        """
        Used for special shapes that need extra behaviour after being created.
        """
        pass

    def as_pydantic(self, shape: ApiCoreShape) -> ApiShape:
        raise Exception(f"{self.__class__.__name__} has no pydantic model")

    def get_center_offset(self, x: float, y: float) -> Tuple[float, float]:
        return 0, 0

    def set_location(self, points: list[tuple[float, float]]) -> None:
        logger.error("Attempt to set location on shape without location info")

    def make_copy(self, new_shape: Shape):
        table = type(self)
        _dict = self.as_pydantic().dict()
        del _dict["shape"]
        table.create(shape=new_shape, **_dict)


class BaseRect(ShapeType):
    width = cast(float, FloatField())
    height = cast(float, FloatField())

    def get_center_offset(self, x: int, y: int) -> Tuple[float, float]:
        return self.width / 2, self.height / 2


class AssetRect(BaseRect):
    src = cast(str, TextField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiAssetRectShape(
            **shape.dict(), src=self.src, width=self.width, height=self.height
        )


class Circle(ShapeType):
    radius = cast(float, FloatField())
    viewing_angle = cast(float | None, FloatField(null=True))

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiCircleShape(
            **shape.dict(),
            radius=self.radius,
            viewing_angle=self.viewing_angle,
        )


class CircularToken(Circle):
    text = cast(str, TextField())
    font = cast(str, TextField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiCircularTokenShape(
            **shape.dict(),
            radius=self.radius,
            viewing_angle=self.viewing_angle,
            text=self.text,
            font=self.font,
        )


class Line(ShapeType):
    x2 = cast(float, FloatField())
    y2 = cast(float, FloatField())
    line_width = cast(int, IntegerField())

    def get_center_offset(self, x: int, y: int) -> Tuple[float, float]:
        return (self.x2 - self.shape.x) / 2, (self.y2 - self.shape.y) / 2

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiLineShape(
            **shape.dict(), x2=self.x2, y2=self.y2, line_width=self.line_width
        )


class Polygon(ShapeType):
    vertices = cast(str, TextField())
    line_width = cast(int, IntegerField())
    open_polygon = cast(bool, BooleanField())

    @staticmethod
    def pre_create(**kwargs):
        kwargs["vertices"] = json.dumps(kwargs["vertices"])
        return kwargs

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiPolygonShape(
            **shape.dict(),
            vertices=self.vertices,
            line_width=self.line_width,
            open_polygon=self.open_polygon,
        )

    def set_location(self, points: List[List[float]]) -> None:
        self.vertices = json.dumps(points)
        self.save()


class Rect(BaseRect):
    def as_pydantic(self, shape: ApiCoreShape):
        return ApiRectShape(**shape.dict(), width=self.width, height=self.height)


class Text(ShapeType):
    text = cast(str, TextField())
    font_size = cast(int, IntegerField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiTextShape(**shape.dict(), text=self.text, font_size=self.font_size)


class ToggleComposite(ShapeType):
    """
    Toggle shapes are composites that have multiple variants but only show one at a time.
    """

    active_variant = cast(Optional[str], TextField(null=True))

    @staticmethod
    def post_create(subshape, **kwargs):
        for variant in kwargs.get("variants", []):
            CompositeShapeAssociation.create(
                parent=subshape, variant=variant["uuid"], name=variant["name"]
            )

    def as_pydantic(self, shape: ApiCoreShape) -> ApiShape:
        return ApiToggleCompositeShape(
            **shape.dict(),
            active_variant=self.active_variant,
            variants=[
                ToggleVariant(uuid=sv.variant.uuid, name=sv.name)
                for sv in self.shape.shape_variants
            ],
        )


class CompositeShapeAssociation(BaseModel):
    variant = ForeignKeyField(Shape, backref="composite_parent", on_delete="CASCADE")
    parent = ForeignKeyField(Shape, backref="shape_variants", on_delete="CASCADE")
    name = cast(str, TextField())
    name = cast(str, TextField())
