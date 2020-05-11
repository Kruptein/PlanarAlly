from peewee import ForeignKeyField

from .base import BaseModel
from .campaign import Location
from .shape import Shape
from .user import User

__all__ = ["Marker"]

class Marker(BaseModel):
    from .shape import Shape

    shape = ForeignKeyField(Shape, backref="markers", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="markers", on_delete="CASCADE")
    location = ForeignKeyField(Location, backref="markers", on_delete="CASCADE")

    def __repr__(self):
        return f"<Marker {self.shape.uuid} {self.location.get_path()} - {self.user.name}"

    def as_string(self):
        return f"{self.shape_id}"