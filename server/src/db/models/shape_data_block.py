from typing import cast

from peewee import ForeignKeyField

from .data_block import DataBlock
from .shape import Shape


class ShapeDataBlock(DataBlock):
    shape_id: str

    shape = cast(Shape, ForeignKeyField(Shape, backref="data_blocks", on_delete="CASCADE"))

    def as_pydantic(self):
        from ...api.models.data_block import ApiShapeDataBlock

        return ApiShapeDataBlock(
            source=self.source,
            name=self.name,
            category="shape",
            data=self.data,
            shape=self.shape_id,
        )
