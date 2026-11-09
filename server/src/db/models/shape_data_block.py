from typing import cast

from peewee import ForeignKeyField, TextField

from .data_block import DataBlock
from .shape import Shape


class ShapeDataBlock(DataBlock):
    shape_id: str

    shape = cast(Shape, ForeignKeyField(Shape, backref="data_blocks", on_delete="CASCADE"))
    read_access = cast(str, TextField(default="owner"))
    write_access = cast(str, TextField(default="owner"))

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("source", "name", "shape"), True),)

    def as_pydantic(self):
        from ...api.models.data_block import ApiShapeDataBlock

        return ApiShapeDataBlock(
            source=self.source,
            name=self.name,
            category="shape",
            data=self.data,
            shape=self.shape_id,
        )
