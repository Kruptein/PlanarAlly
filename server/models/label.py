from peewee import BooleanField, ForeignKeyField, TextField
from playhouse.shortcuts import model_to_dict

from .base import BaseModel
from .shape import Shape
from .user import User


class Label(BaseModel):
    uuid = TextField(primary_key=True)
    user = ForeignKeyField(User, backref="labels", on_delete="CASCADE")
    name = TextField()
    visible = BooleanField()
    default_selection = BooleanField(default=False)

    def as_dict(self):
        d = model_to_dict(self, recurse=False, exclude=[Label.id])
        d["user"] = self.user.name
        return d


class ShapeLabel(BaseModel):
    shape = ForeignKeyField(Shape, backref="labels", on_delete="CASCADE")
    label = ForeignKeyField(Label, backref="shapes", on_delete="CASCADE")

    def as_dict(self):
        return self.label.as_dict()
