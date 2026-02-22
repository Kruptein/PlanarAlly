from typing import cast

from peewee import ForeignKeyField, TextField

from ..base import BaseDbModel
from .asset import Asset
from .shape import Shape
from .user import User


class ShapeTemplate(BaseDbModel):
    id: int
    shape_id: str

    owner = cast(User, ForeignKeyField(User, backref="shape_templates", on_delete="CASCADE"))
    name = cast(str, TextField())
    shape = cast(Shape, ForeignKeyField(Shape, backref="templates", on_delete="CASCADE"))
    # We theoretically already have access to the asset through the shape,
    # but this makes queriying templates from an asset easier/more performant.
    # (e.g. in to_api/asset.py)
    asset = cast(Asset, ForeignKeyField(Asset, backref="templates", on_delete="CASCADE"))

    def __repr__(self):
        return f"<ShapeTemplate {self.name}>"
