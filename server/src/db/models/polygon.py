import json
from typing import List, cast

from peewee import BooleanField, IntegerField, TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiPolygonShape
from .shape_type import ShapeType


class Polygon(ShapeType):
    vertices = cast(str, TextField())
    line_width = cast(int, IntegerField())
    open_polygon = cast(bool, BooleanField())

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
