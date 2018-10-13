import uuid
from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField

from .base import BaseModel
from .user import User


class Room(BaseModel):
    name = TextField()
    creator = ForeignKeyField(User, backref='rooms_created')
    invitation_code = TextField(default=uuid.uuid4)
    player_location = TextField(null=True)
    dm_location = TextField(null=True)

    def __repr__(self):
        return f"<Room {self.creator.user}/{self.name}>"

    class Meta:
        indexes = ((('name', 'creator'), True),)


class PlayerRoom(BaseModel):
    player = ForeignKeyField(User, backref='rooms_joined')
    room = ForeignKeyField(Room, backref='players')

    def __repr__(self):
        return f"<PlayerRoom {self.room.name} - {self.player.user}>"


class Location(BaseModel):
    room = ForeignKeyField(Room, backref='locations')
    name = TextField()
    # initiative ?

    class Meta:
        indexes = ((('room', 'name'), True),)


class LocationUserOption(BaseModel):
    location = ForeignKeyField(Location)
    user = ForeignKeyField(User, backref='location_options')
    pan_x = IntegerField(default=0)
    pan_y = IntegerField(default=0)
    zoom_factor = FloatField(default=1.0)


class Layer(BaseModel):
    location = ForeignKeyField(Location, backref='layers')
    name = TextField()
    # TYPE = IntegerField()  # normal/grid/dm/lighting ???????????
    player_visible = BooleanField(default=False)
    player_editable = BooleanField(default=False)
    selectable = BooleanField(default=True)
    index = IntegerField()

    class Meta:
        indexes = ((('location', 'name'), True), (('location', 'index'), True))


class Shape(BaseModel):
    uuid = TextField(primary_key=True)
    layer = ForeignKeyField(Layer, backref='shapes')
    x = IntegerField()
    y = IntegerField()
    name = TextField(null=True)
    fill_colour = TextField(default="#000")
    border_colour = TextField(default="#fff")
    vision_obstruction = BooleanField(default=False)
    movement_obstruction = BooleanField(default=False)
    is_token = BooleanField(default=False)
    annotation = TextField(default='')
    draw_operator = TextField(default='source-over')
    index = IntegerField()

    class Meta:
        indexes = ((('layer', 'index'), True),)

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