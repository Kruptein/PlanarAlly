from peewee import BlobField, IntegerField

from .base import BaseModel


__all__ = ["Constants"]


class Constants(BaseModel):
    save_version = IntegerField()
    secret_token = BlobField()
