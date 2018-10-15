from playhouse.sqlite_ext import SqliteExtDatabase

from config import SAVE_FILE

db = SqliteExtDatabase(SAVE_FILE)

from .user import User
from .campaign import Room, Location, LocationUserOption, Layer, PlayerRoom
from .shape import Shape, Tracker, Aura, ShapeOwner, AssetShape, Circle, CircularToken, Line, MultiLine, Rect, Text
from .general import Constants
from .asset import Asset

ALL_MODELS = [User, Room, Location, LocationUserOption, Layer, Shape,
              PlayerRoom, Tracker, Aura, ShapeOwner, Constants, Asset,
              AssetShape, Circle, CircularToken, Line, MultiLine, Rect, Text]


def get_table(name):
    for model in ALL_MODELS:
        if model._meta.name == name:
            return model


def _start_peewee_log():
    import logging
    l = logging.getLogger('peewee')
    l.addHandler(logging.StreamHandler())
    l.setLevel(logging.DEBUG)
