from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from .base import BaseModel
from .user import User


class Room(BaseModel):
    name = TextField()
    creator = ForeignKeyField(User, backref='rooms')
    invitation_code = TextField()
    player_location = TextField()
    dm_location = TextField()


class PlayerRoom(BaseModel):
    player = ForeignKeyField(User, backref='rooms')
    room = ForeignKeyField(Room, backref='players')


class Location(BaseModel):
    room = ForeignKeyField(Room, backref='locations')
    name = TextField()
    # initiative ?


class Layer(BaseModel):
    location = ForeignKeyField(Location, backref='layers')
    name = TextField()
    # TYPE = IntegerField()  # normal/grid/dm/lighting ???????????
    player_visible = BooleanField(default=False)
    player_editable = BooleanField(default=False)
    selectable = BooleanField(default=True)


class Shape(BaseModel):
    uuid = TextField(primary_key=True)
    layer = ForeignKeyField(Layer, backref='shapes')
    refPoint_X = IntegerField()
    refPoint_Y = IntegerField()
    name = TextField(null=True)
    fill_colour = TextField(default="#000")
    border_colour = TextField(default="#fff")
    vision_obstruction = BooleanField(default=False)
    movement_obstruction = BooleanField(default=False)
    is_token = BooleanField(default=False)
    annotation = TextField(default='')
    draw_operator = TextField(default='source-over')

    # options ???


class Tracker(BaseModel):
    uuid = TextField(primary_key=True)
    shape = ForeignKeyField(Shape, backref='trackers')
    visible = BooleanField()
    name = TextField()
    value = IntegerField()
    maxvalue = IntegerField()


class Aura(BaseModel):
    uuid = TextField(primary_key=True)
    shape = ForeignKeyField(Shape, backref='auras')
    light_source = BooleanField()
    visible = BooleanField()
    name = TextField()
    value = IntegerField()
    dim = IntegerField()
    colour = TextField()


class ShapeOwner(BaseModel):
    shape = ForeignKeyField(Shape, backref='owners')
    user = ForeignKeyField(User, backref='shapes')
