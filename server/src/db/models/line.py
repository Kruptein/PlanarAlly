from typing import Tuple, cast

from peewee import FloatField, IntegerField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiLineShape
from .shape_type import ShapeType


class Line(ShapeType):
    x2 = cast(float, FloatField())
    y2 = cast(float, FloatField())
    line_width = cast(int, IntegerField())

    def get_center_offset(self) -> Tuple[float, float]:
        return (self.x2 - self.shape.x) / 2, (self.y2 - self.shape.y) / 2

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiLineShape(**shape.dict(), x2=self.x2, y2=self.y2, line_width=self.line_width)
