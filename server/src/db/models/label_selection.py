from typing import cast

from peewee import ForeignKeyField

from ..base import BaseDbModel
from .label import Label
from .room import Room
from .user import User


class LabelSelection(BaseDbModel):
    label = cast(Label, ForeignKeyField(Label, on_delete="CASCADE"))
    user = cast(User, ForeignKeyField(User, on_delete="CASCADE"))
    room = cast(Room, ForeignKeyField(Room, on_delete="CASCADE"))
