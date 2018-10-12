import bcrypt
from peewee import ForeignKeyField, TextField

from .base import BaseModel


class User(BaseModel):
    username = TextField()
    password_hash = TextField()

    def set_password(self, pw):
        pwhash = bcrypt.hashpw(pw.encode('utf8'), bcrypt.gensalt())
        self.password_hash = pwhash.decode('utf8')
    
    def check_password(self, pw):
        if self.password_hash is None:
            return False
        expected_hash = self.password_hash.encode('utf8')
        return bcrypt.checkpw(pw.encode('utf8'), expected_hash)


class UserOption(BaseModel):
    user = ForeignKeyField(User, backref='options')
    fow_colour = TextField(default='#000')
    grid_colour = TextField(default='#000')
    ruler_colour = TextField(default='#F00')
