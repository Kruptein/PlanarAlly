from typing import Tuple, cast

from peewee import FloatField

from .shape_type import ShapeType


class BaseRect(ShapeType):
    width = cast(float, FloatField())
    height = cast(float, FloatField())

    def get_center_offset(self, x: int, y: int) -> Tuple[float, float]:
        return self.width / 2, self.height / 2
