from typing import cast

from peewee import IntegerField, TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiTextShape
from .shape_type import ShapeType


class Text(ShapeType):
    text = cast(str, TextField())
    font_size = cast(int, IntegerField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiTextShape(**shape.model_dump(), text=self.text, font_size=self.font_size)
