from peewee import BooleanField, ForeignKeyField, TextField
from playhouse.shortcuts import model_to_dict

from .custom_fields import UUIDTextField
from .base import BaseModel
from .campaign import Room
from .user import User


__all__ = ["Label", "LabelSelection"]


class Label(BaseModel):
    uuid = UUIDTextField(primary_key=True)
    user = ForeignKeyField(User, backref="labels", on_delete="CASCADE")
    category = TextField(null=True)
    name = TextField()
    visible = BooleanField()

    def as_dict(self):
        d = model_to_dict(self, recurse=False, exclude=[Label.id])
        d["user"] = self.user.name
        return d


class LabelSelection(BaseModel):
    label = ForeignKeyField(Label, on_delete="CASCADE")
    user = ForeignKeyField(User, on_delete="CASCADE")
    room = ForeignKeyField(Room, on_delete="CASCADE")
