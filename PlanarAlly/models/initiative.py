from peewee import BlobField, BooleanField, ForeignKeyField, IntegerField, TextField

from .base import BaseModel


__all__ = ["Initiative"]


class Initiative(BaseModel):
    uuid = TextField(primary_key=True)
    initiative = IntegerField(null=True)
    visible = BooleanField(default=False)
    group = BooleanField(default=False)
    source = TextField()
    has_img = BooleanField(default=False)


class InitiativeEffect(BaseModel):
    uuid = TextField(primary_key=True)
    initiative = ForeignKeyField(Initiative, backref="effects", on_delete="CASCADE")
    name = TextField()
    turns = IntegerField()
