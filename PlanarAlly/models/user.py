from peewee import ForeignKeyField, TextField

from .base import BaseModel


class User(BaseModel):
    username = TextField()
    password_hash = TextField()


class UserOption(BaseModel):
    user = ForeignKeyField(User, backref='options')
    fow_colour = TextField(default='#000')
    grid_colour = TextField(default='#000')
    ruler_colour = TextField(default='#F00')
