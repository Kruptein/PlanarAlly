import json
from typing import cast

from peewee import ForeignKeyField, TextField

from ...api.models.shape.custom_data import (
    ApiShapeCustomDataBoolean,
    ApiShapeCustomDataDiceExpression,
    ApiShapeCustomDataNumber,
    ApiShapeCustomDataText,
)
from ..base import BaseDbModel
from .shape import Shape

custom_data_map = {
    "number": ApiShapeCustomDataNumber,
    "text": ApiShapeCustomDataText,
    "boolean": ApiShapeCustomDataBoolean,
    "dice-expression": ApiShapeCustomDataDiceExpression,
}


class ShapeCustomData(BaseDbModel):
    shape = cast(Shape, ForeignKeyField(Shape, backref="custom_data", on_delete="CASCADE"))

    source = cast(str, TextField())  # PA itself or a mod
    prefix = cast(str, TextField())
    name = cast(str, TextField())
    kind = cast(str, TextField())  # number, string, boolean, dice-expression
    value = cast(str, TextField())  # JSON string
    description = cast(str, TextField(null=True))

    class Meta:
        indexes = ((("shape", "source", "prefix", "name"), True),)

    def as_pydantic(self):
        # from ...api.models.shape.custom_data import ApiShapeCustomData

        return custom_data_map[self.kind](
            shapeId=self.shape.uuid,
            source=self.source,
            prefix=self.prefix,
            name=self.name,
            kind=self.kind,
            value=json.loads(self.value),
            description=self.description,
        )
