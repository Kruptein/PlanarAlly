from peewee import SqliteDatabase
from config import SAVE_FILE

db = SqliteDatabase(SAVE_FILE)

from .user import User
from .campaign import Room, Location, Layer, Shape, PlayerRoom, Tracker, Aura, ShapeOwner
from .general import Constants
from .asset import Asset

ALL_MODELS = [User, Room, Location, Layer, Shape,
              PlayerRoom, Tracker, Aura, ShapeOwner, Constants, Asset]
