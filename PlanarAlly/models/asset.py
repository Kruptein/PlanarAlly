from peewee import ForeignKeyField, TextField

from .base import BaseModel
from .user import User


class Asset(BaseModel):
    owner = ForeignKeyField(User, backref="assets", on_delete="CASCADE")
    parent = ForeignKeyField("self", backref="children", null=True, on_delete="CASCADE")
    name = TextField()
    file_hash = TextField(null=True)

    def __repr__(self):
        return f"<Asset {self.owner.name} - {self.name}>"
