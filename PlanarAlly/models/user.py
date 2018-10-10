from peewee import TextField

from .base import BaseModel


class User(BaseModel):
    username = TextField()
    password_hash = TextField()
    # asset_info
    # options
