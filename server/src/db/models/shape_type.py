from typing import cast

from peewee import ForeignKeyField
from playhouse.shortcuts import model_to_dict

from ...api.models.shape import ApiShape
from ...api.models.shape.shape import ApiCoreShape
from ...db.models.shape import Shape
from ...logs import logger
from ..base import BaseDbModel


class ShapeType(BaseDbModel):
    shape = cast(Shape, ForeignKeyField(Shape, primary_key=True, on_delete="CASCADE"))

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

    def get_center_offset(self) -> tuple[float, float]:
        return 0, 0

    def set_location(self, points: list[tuple[float, float]]) -> None:
        logger.error("Attempt to set location on shape without location info")

    def make_copy(self, new_shape: Shape):
        table = type(self)
        _dict = model_to_dict(self, exclude=[table.shape])
        table.create(shape=new_shape, **_dict)
