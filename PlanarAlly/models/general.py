from peewee import BlobField, IntegerField

from .base import BaseModel


class Constants(BaseModel):
    save_version = IntegerField()
    secret_token = BlobField()
