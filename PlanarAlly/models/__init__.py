from playhouse.sqlite_ext import SqliteExtDatabase

from config import SAVE_FILE

db = SqliteExtDatabase(
    SAVE_FILE,
    pragmas={
        "journal_mode": "wal",
        "cache_size": -1 * 6400,
        "foreign_keys": 1,
        "ignore_check_constraints": 0,
        "synchronous": 0,
    },
)


def get_table(name):
    for model in ALL_MODELS:
        if model._meta.name == name:
            return model


from .user import User
from .campaign import Room, Location, LocationUserOption, Layer, PlayerRoom, GridLayer
from .shape import (
    Shape,
    Tracker,
    Aura,
    ShapeOwner,
    AssetRect,
    Circle,
    CircularToken,
    Line,
    MultiLine,
    Rect,
    Text,
)
from .general import Constants
from .asset import Asset
from .signals import *

ALL_MODELS = [
    User,
    Room,
    Location,
    LocationUserOption,
    Layer,
    Shape,
    PlayerRoom,
    Tracker,
    Aura,
    ShapeOwner,
    Constants,
    Asset,
    AssetRect,
    Circle,
    CircularToken,
    Line,
    MultiLine,
    Rect,
    Text,
    GridLayer,
]


def _start_peewee_log():
    import logging

    l = logging.getLogger("peewee")
    l.addHandler(logging.StreamHandler())
    l.setLevel(logging.DEBUG)
