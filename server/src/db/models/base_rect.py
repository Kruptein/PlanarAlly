from typing import cast

from peewee import FloatField

from .shape_type import ShapeType


class BaseRect(ShapeType):
    width = cast(float, FloatField())
    height = cast(float, FloatField())

    def get_center_offset(self) -> tuple[float, float]:
        return self.width / 2, self.height / 2
