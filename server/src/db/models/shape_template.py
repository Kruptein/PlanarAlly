from typing import cast

from peewee import ForeignKeyField, TextField

from ..base import BaseDbModel
from .asset import Asset
from .shape import Shape


class ShapeTemplate(BaseDbModel):
    id: int
    shape_id: str

    name = cast(str, TextField())
    shape = cast(Shape, ForeignKeyField(Shape, backref="templates", on_delete="CASCADE"))
    # We theoretically already have access to the asset through the shape,
    # but this makes queriying templates from an asset easier/more performant.
    asset = cast(Asset, ForeignKeyField(Asset, backref="templates", on_delete="CASCADE"))

    def __repr__(self):
        return f"<ShapeTemplate {self.name}>"
