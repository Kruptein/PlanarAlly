from peewee import ForeignKeyField

from ...db.models.shape import Shape
from ..base import BaseDbModel
from .label import Label


class ShapeLabel(BaseDbModel):
    shape = ForeignKeyField(Shape, backref="labels", on_delete="CASCADE")
    label = ForeignKeyField(Label, backref="shapes", on_delete="CASCADE")

    def make_copy(self, shape):
        ShapeLabel.create(shape=shape, label=self.label.make_copy())
