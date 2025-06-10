from peewee import ForeignKeyField

from ..base import BaseDbModel
from .location import Location
from .user import User


class Marker(BaseDbModel):
    from .shape import Shape

    shape_id: str

    shape = ForeignKeyField(Shape, backref="markers", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="markers", on_delete="CASCADE")
    location = ForeignKeyField(Location, backref="markers", on_delete="CASCADE")

    def __repr__(self):
        return f"<Marker {self.shape.uuid} {self.location.get_path()} - {self.user.name}"

    def as_string(self):
        return f"{self.shape_id}"
