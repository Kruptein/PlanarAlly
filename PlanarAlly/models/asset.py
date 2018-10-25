from peewee import ForeignKeyField, TextField

from .base import BaseModel
from .user import User

__all__ = ["Asset"]


class Asset(BaseModel):
    owner = ForeignKeyField(User, backref="assets", on_delete="CASCADE")
    parent = ForeignKeyField("self", backref="children", null=True, on_delete="CASCADE")
    name = TextField()
    file_hash = TextField(null=True)

    def __repr__(self):
        return f"<Asset {self.owner.name} - {self.name}>"

    @classmethod
    def get_user_structure(cls, user, parent=None):
        # ideally we change this to a single query to get all assets and process them as such
        data = {"__files": []}
        for asset in Asset.select().where(
            (Asset.owner == user) & (Asset.parent == parent)
        ):
            if asset.file_hash:
                data["__files"].append({"name": asset.name, "hash": asset.file_hash})
            else:
                data[asset.name] = cls.get_user_structure(user, asset)
        return data
