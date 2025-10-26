from typing import cast

from peewee import TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiCircularTokenShape
from .circle import Circle


class CircularToken(Circle):
    text = cast(str, TextField())
    font = cast(str, TextField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiCircularTokenShape(
            **shape.model_dump(),
            radius=self.radius,
            viewing_angle=self.viewing_angle,
            text=self.text,
            font=self.font,
        )
