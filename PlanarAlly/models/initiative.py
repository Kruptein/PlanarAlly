from peewee import BlobField, BooleanField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from .base import BaseModel


__all__ = ["Initiative", "InitiativeEffect"]


class Initiative(BaseModel):
    uuid = TextField(primary_key=True)
    initiative = IntegerField(null=True)
    visible = BooleanField(default=False)
    group = BooleanField(default=False)
    source = TextField()
    has_img = BooleanField(default=False)
    index = IntegerField()

    def as_dict(self):
        return model_to_dict(self, recurse=False)


class InitiativeEffect(BaseModel):
    uuid = TextField(primary_key=True)
    initiative = ForeignKeyField(Initiative, backref="effects", on_delete="CASCADE")
    name = TextField()
    turns = IntegerField()
