from peewee import ForeignKeyField, TextField

from .base import BaseModel
from .user import User


class Asset(BaseModel):
    owner = ForeignKeyField(User, backref='assets')
    parent = ForeignKeyField('self', backref='children', null=True)
    name = TextField()
    file_hash = TextField(null=True)

    def __repr__(self):
        return f"<Asset {self.owner.name} - {self.name}>"
