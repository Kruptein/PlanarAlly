from typing import cast

from peewee import TextField

from ..base import BaseDbModel


class Notification(BaseDbModel):
    uuid = TextField(primary_key=True)
    message = cast(str, TextField())

    def __repr__(self):
        return f"<Notification {self.uuid} {self.message[:15]}>"
