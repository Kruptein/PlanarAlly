import bcrypt
from peewee import fn, ForeignKeyField, TextField
from playhouse.shortcuts import model_to_dict

from .base import BaseModel


class User(BaseModel):
    name = TextField()
    password_hash = TextField()
    fow_colour = TextField(default="#000")
    grid_colour = TextField(default="#000")
    ruler_colour = TextField(default="#F00")

    def __repr__(self):
        return f"<User {self.name}>"

    def set_password(self, pw):
        pwhash = bcrypt.hashpw(pw.encode("utf8"), bcrypt.gensalt())
        self.password_hash = pwhash.decode("utf8")

    def check_password(self, pw):
        if self.password_hash is None:
            return False
        expected_hash = self.password_hash.encode("utf8")
        return bcrypt.checkpw(pw.encode("utf8"), expected_hash)

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[User.id, User.password_hash])

    @classmethod
    def by_name(clz, name):
        return clz.get_or_none(fn.Lower(clz.name) == name.lower())
