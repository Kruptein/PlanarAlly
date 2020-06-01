import uuid
from peewee import (
    fn,
    BooleanField,
    FloatField,
    ForeignKeyField,
    IntegerField,
    TextField,
)
from playhouse.shortcuts import model_to_dict

from .base import BaseModel
from .user import User
from .utils import get_table

__all__ = [
    "Floor",
    "Layer",
    "Location",
    "LocationOptions",
    "LocationUserOption",
    "Note",
    "PlayerRoom",
    "Room",
]


class LocationOptions(BaseModel):
    unit_size = FloatField(default=5, null=True)
    unit_size_unit = TextField(default="ft", null=True)
    use_grid = BooleanField(default=True, null=True)
    full_fow = BooleanField(default=False, null=True)
    fow_opacity = FloatField(default=0.3, null=True)
    fow_los = BooleanField(default=False, null=True)
    vision_mode = TextField(default="triangle", null=True)
    grid_size = IntegerField(default=50, null=True)
    # default is 1km max, 0.5km min
    vision_min_range = FloatField(default=1640, null=True)
    vision_max_range = FloatField(default=3281, null=True)
    spawn_locations = TextField(default="[]")

    def as_dict(self):
        return {
            k: v
            for k, v in model_to_dict(
                self, backrefs=None, recurse=None, exclude=[LocationOptions.id]
            ).items()
            if v is not None
        }


class Room(BaseModel):
    name = TextField()
    creator = ForeignKeyField(User, backref="rooms_created", on_delete="CASCADE")
    invitation_code = TextField(default=uuid.uuid4, unique=True)
    is_locked = BooleanField(default=False)
    default_options = ForeignKeyField(LocationOptions, on_delete="CASCADE")

    def __repr__(self):
        return f"<Room {self.get_path()}>"

    def get_path(self):
        return f"{self.creator.name}/{self.name}"

    class Meta:
        indexes = ((("name", "creator"), True),)


class Location(BaseModel):
    room = ForeignKeyField(Room, backref="locations", on_delete="CASCADE")
    name = TextField()
    options = ForeignKeyField(LocationOptions, on_delete="CASCADE", null=True)
    index = IntegerField()

    def __repr__(self):
        return f"<Location {self.get_path()}>"

    def get_path(self):
        return f"{self.room.get_path()}/{self.name}"

    def as_dict(self):
        data = model_to_dict(
            self,
            backrefs=False,
            recurse=False,
            exclude=[Location.room, Location.index, Location.options],
        )
        if self.options is not None:
            data["options"] = self.options.as_dict()
        else:
            data["options"] = {}
        return data

    def create_floor(self, name="ground"):
        index = (
            Floor.select(fn.Max(Floor.index)).where(Floor.location == self).scalar()
            or -1
        ) + 1
        floor = Floor.create(location=self, name=name, index=index)
        Layer.create(
            location=self,
            name="map",
            type_="normal",
            player_visible=True,
            index=0,
            floor=floor,
        )
        Layer.create(
            location=self,
            name="grid",
            type_="grid",
            selectable=False,
            player_visible=True,
            index=1,
            floor=floor,
        )
        Layer.create(
            location=self,
            name="tokens",
            type_="normal",
            player_visible=True,
            player_editable=True,
            index=2,
            floor=floor,
        )
        Layer.create(location=self, type_="normal", name="dm", index=3, floor=floor)
        Layer.create(
            location=self,
            type_="fow",
            name="fow",
            player_visible=True,
            index=4,
            floor=floor,
        )
        Layer.create(
            location=self,
            name="fow-players",
            type_="fow-players",
            selectable=False,
            player_visible=True,
            index=5,
            floor=floor,
        )
        Layer.create(
            location=self,
            name="draw",
            type_="normal",
            selectable=False,
            player_visible=True,
            player_editable=True,
            index=6,
            floor=floor,
        )
        return floor


class PlayerRoom(BaseModel):
    role = IntegerField()
    player = ForeignKeyField(User, backref="rooms_joined", on_delete="CASCADE")
    room = ForeignKeyField(Room, backref="players", on_delete="CASCADE")
    active_location = ForeignKeyField(Location, backref="players", on_delete="CASCADE")

    def __repr__(self):
        return f"<PlayerRoom {self.room.get_path()} - {self.player.name}>"


class Note(BaseModel):
    uuid = TextField(primary_key=True)
    room = ForeignKeyField(Room, backref="notes", on_delete="CASCADE")
    location = ForeignKeyField(
        Location, null=True, backref="notes", on_delete="CASCADE"
    )
    user = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = TextField(null=True)
    text = TextField(null=True)

    def __repr__(self):
        return f"<Note {self.title} {self.room.get_path()} - {self.user.name}"

    def as_dict(self):
        return model_to_dict(
            self, recurse=False, exclude=[Note.room, Note.location, Note.user]
        )


class Floor(BaseModel):
    location = ForeignKeyField(Location, backref="floors", on_delete="CASCADE")
    index = IntegerField()
    name = TextField()

    def __repr__(self):
        return f"<Floor {self.name} {[self.index]}>"

    def as_dict(self, user: User, dm: bool):
        data = model_to_dict(self, recurse=False, exclude=[Floor.id, Floor.location])
        if dm:
            data["layers"] = [
                l.as_dict(user, True) for l in self.layers.order_by(Layer.index)
            ]
        else:
            data["layers"] = [
                l.as_dict(user, False)
                for l in self.layers.order_by(Layer.index).where(Layer.player_visible)
            ]
        return data


class Layer(BaseModel):
    floor = ForeignKeyField(Floor, backref="layers", on_delete="CASCADE")
    name = TextField()
    type_ = TextField()
    # TYPE = IntegerField()  # normal/grid/dm/lighting ???????????
    player_visible = BooleanField(default=False)
    player_editable = BooleanField(default=False)
    selectable = BooleanField(default=True)
    index = IntegerField()

    def __repr__(self):
        return f"<Layer {self.get_path()}>"

    def get_path(self):
        return f"{self.floor.location.get_path()}/{self.name}"

    def as_dict(self, user: User, dm: bool):
        from .shape import Shape

        data = model_to_dict(
            self,
            recurse=False,
            backrefs=False,
            exclude=[Layer.id, Layer.player_visible],
        )
        data["shapes"] = [
            shape.as_dict(user, dm) for shape in self.shapes.order_by(Shape.index)
        ]
        return data

    class Meta:
        indexes = ((("floor", "name"), True), (("floor", "index"), True))


class LocationUserOption(BaseModel):
    location = ForeignKeyField(Location, backref="user_options", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="location_options", on_delete="CASCADE")
    pan_x = IntegerField(default=0)
    pan_y = IntegerField(default=0)
    zoom_factor = FloatField(default=1.0)
    active_layer = ForeignKeyField(Layer, backref="active_users", null=True)

    def __repr__(self):
        return f"<LocationUserOption {self.location.get_path()} - {self.user.name}>"

    def as_dict(self):
        d = model_to_dict(
            self,
            recurse=False,
            exclude=[
                LocationUserOption.id,
                LocationUserOption.location,
                LocationUserOption.user,
            ],
        )
        if self.active_layer:
            d["active_layer"] = self.active_layer.name
            d["active_floor"] = self.active_layer.floor.name
        return d

    class Meta:
        indexes = ((("location", "user"), True),)
