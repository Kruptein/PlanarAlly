from peewee import SqliteDatabase

from config import SAVE_FILE

db = SqliteDatabase(SAVE_FILE)

from .user import User
from .campaign import Room, Location, LocationUserOption, Layer, PlayerRoom
from .shape import Shape, Tracker, Aura, ShapeOwner
from .general import Constants
from .asset import Asset

ALL_MODELS = [User, Room, Location, LocationUserOption, Layer, Shape,
              PlayerRoom, Tracker, Aura, ShapeOwner, Constants, Asset]


def get_table(name):
    for model in ALL_MODELS:
        if model._meta.name == name:
            return model


def _start_peewee_log():
    import logging
    l = logging.getLogger('peewee')
    l.addHandler(logging.StreamHandler())
    l.setLevel(logging.DEBUG)
