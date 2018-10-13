from peewee import SqliteDatabase
from config import SAVE_FILE

db = SqliteDatabase(SAVE_FILE)

from .user import User, UserOption
from .campaign import Room, Location, LocationUserOption, Layer, Shape, PlayerRoom, Tracker, Aura, ShapeOwner
from .general import Constants
from .asset import Asset

ALL_MODELS = [User, UserOption, Room, Location, LocationUserOption, Layer, Shape,
              PlayerRoom, Tracker, Aura, ShapeOwner, Constants, Asset]


def _start_peewee_log():
    import logging
    l = logging.getLogger('peewee')
    l.addHandler(logging.StreamHandler())
    l.setLevel(logging.DEBUG)