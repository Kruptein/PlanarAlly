import uuid
from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict

from .base import BaseModel
from .user import User


class Room(BaseModel):
    name = TextField()
    creator = ForeignKeyField(User, backref='rooms_created')
    invitation_code = TextField(default=uuid.uuid4)
    player_location = TextField(null=True)
    dm_location = TextField(null=True)

    def __repr__(self):
        return f"<Room {self.get_path()}>"
    
    def get_path(self):
        return f"{self.creator.name}/{self.name}"

    class Meta:
        indexes = ((('name', 'creator'), True),)


class PlayerRoom(BaseModel):
    player = ForeignKeyField(User, backref='rooms_joined')
    room = ForeignKeyField(Room, backref='players')

    def __repr__(self):
        return f"<PlayerRoom {self.room.get_path()} - {self.player.name}>"


class Location(BaseModel):
    room = ForeignKeyField(Room, backref='locations')
    name = TextField()
    # initiative ?

    def __repr__(self):
        return f"<Location {self.get_path()}>"
    
    def get_path(self):
        return f"{self.room.get_path()}/{self.name}"

    class Meta:
        indexes = ((('room', 'name'), True),)


class LocationUserOption(BaseModel):
    location = ForeignKeyField(Location)
    user = ForeignKeyField(User, backref='location_options')
    pan_x = IntegerField(default=0)
    pan_y = IntegerField(default=0)
    zoom_factor = FloatField(default=1.0)

    def __repr__(self):
        return f"<LocationUserOption {self.location.get_path()} - {self.user.name}>"


class Layer(BaseModel):
    location = ForeignKeyField(Location, backref='layers')
    name = TextField()
    # TYPE = IntegerField()  # normal/grid/dm/lighting ???????????
    player_visible = BooleanField(default=False)
    player_editable = BooleanField(default=False)
    selectable = BooleanField(default=True)
    index = IntegerField()

    def __repr__(self):
        return f"<Layer {self.get_path()}>"
    
    def get_path(self):
        return f"{self.location.get_path()}/{self.name}"
    
    def as_dict(self, user: User, dm: bool):
        from .shape import Shape
        data = model_to_dict(self, recurse=False, exclude=[Layer.id, Layer.player_visible])
        data['shapes'] = [shape.as_dict(user, dm) for shape in self.shapes.order_by(Shape.index)]
        return data

    class Meta:
        indexes = ((('location', 'name'), True), (('location', 'index'), True))
