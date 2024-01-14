from typing import cast

from peewee import ForeignKeyField, TextField

from ...db.models.shape import Shape
from ..base import BaseDbModel


class CompositeShapeAssociation(BaseDbModel):
    variant = ForeignKeyField(Shape, backref="composite_parent", on_delete="CASCADE")
    parent = ForeignKeyField(Shape, backref="shape_variants", on_delete="CASCADE")
    name = cast(str, TextField())
