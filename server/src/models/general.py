from peewee import BlobField, IntegerField, TextField

from .base import BaseModel


__all__ = ["Constants"]


class Constants(BaseModel):
    save_version = IntegerField()
    secret_token = BlobField()
    api_token = TextField()
