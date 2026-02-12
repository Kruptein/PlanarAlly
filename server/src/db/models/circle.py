from typing import cast

from peewee import FloatField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiCircleShape
from .shape_type import ShapeType


class Circle(ShapeType):
    radius = cast(float, FloatField())
    viewing_angle = cast(float | None, FloatField(null=True))

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiCircleShape(
            **shape.model_dump(),
            radius=self.radius,
            viewing_angle=self.viewing_angle,
        )
