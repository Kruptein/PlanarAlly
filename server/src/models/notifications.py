from typing import cast
from peewee import TextField

from .base import BaseModel

__all__ = ["Notification"]


class Notification(BaseModel):
    uuid = TextField(primary_key=True)
    message = cast(str, TextField())

    def __repr__(self):
        return f"<Notification {self.uuid} {self.message[:15]}>"
