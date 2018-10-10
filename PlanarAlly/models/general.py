from peewee import IntegerField, TextField

from .base import BaseModel


class General(BaseModel):
    save_version = IntegerField()
    secret_token = TextField()