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
    "GridLayer",
    "Layer",
    "Location",
    "LocationUserOption",
    "Note",
    "PlayerRoom",
    "Room",
]


class Room(BaseModel):
    name = TextField()
    creator = ForeignKeyField(
        User, backref="rooms_created", on_delete="CASCADE")
    invitation_code = TextField(default=uuid.uuid4, unique=True)
    player_location = TextField(null=True)
    dm_location = TextField(null=True)

    def __repr__(self):
        return f"<Room {self.get_path()}>"

    def get_path(self):
        return f"{self.creator.name}/{self.name}"

    def get_active_location(self, dm):
        if dm:
            return Location.get(room=self, name=self.dm_location)
        else:
            return Location.get(room=self, name=self.player_location)

    class Meta:
        indexes = ((("name", "creator"), True),)


class PlayerRoom(BaseModel):
    player = ForeignKeyField(User, backref="rooms_joined", on_delete="CASCADE")
    room = ForeignKeyField(Room, backref="players", on_delete="CASCADE")

    def __repr__(self):
        return f"<PlayerRoom {self.room.get_path()} - {self.player.name}>"


class Location(BaseModel):
    room = ForeignKeyField(Room, backref="locations", on_delete="CASCADE")
    name = TextField()
    unit_size = FloatField(default=5)
    use_grid = BooleanField(default=True)
    full_fow = BooleanField(default=False)
    fow_opacity = FloatField(default=0.3)
    fow_los = BooleanField(default=False)
    # initiative ?

    def __repr__(self):
        return f"<Location {self.get_path()}>"

    def get_path(self):
        return f"{self.room.get_path()}/{self.name}"

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[Location.id, Location.room])

    def add_default_layers(self):
        Layer.create(
            location=self, name="map", type_="normal", player_visible=True, index=0
        )
        Layer.create(
            location=self,
            name="grid",
            type_="grid",
            selectable=False,
            player_visible=True,
            index=1,
        )
        Layer.create(
            location=self,
            name="tokens",
            type_="normal",
            player_visible=True,
            player_editable=True,
            index=2,
        )
        Layer.create(location=self, type_="normal", name="dm", index=3)
        Layer.create(
            location=self, type_="fow", name="fow", player_visible=True, index=4
        )
        Layer.create(
            location=self,
            name="fow-players",
            type_="fow-players",
            selectable=False,
            player_visible=True,
            index=5,
        )
        Layer.create(
            location=self,
            name="draw",
            type_="normal",
            selectable=False,
            player_visible=True,
            player_editable=True,
            index=6,
        )

    class Meta:
        indexes = ((("room", "name"), True),)


class LocationUserOption(BaseModel):
    location = ForeignKeyField(
        Location, backref="user_options", on_delete="CASCADE")
    user = ForeignKeyField(
        User, backref="location_options", on_delete="CASCADE")
    pan_x = IntegerField(default=0)
    pan_y = IntegerField(default=0)
    zoom_factor = FloatField(default=1.0)

    def __repr__(self):
        return f"<LocationUserOption {self.location.get_path()} - {self.user.name}>"

    def as_dict(self):
        return model_to_dict(
            self,
            recurse=False,
            exclude=[
                LocationUserOption.id,
                LocationUserOption.location,
                LocationUserOption.user,
            ],
        )

    class Meta:
        indexes = ((("location", "user"), True),)


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


class Layer(BaseModel):
    location = ForeignKeyField(Location, backref="layers", on_delete="CASCADE")
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
        return f"{self.location.get_path()}/{self.name}"

    def as_dict(self, user: User, dm: bool):
        from .shape import Shape

        data = model_to_dict(
            self, recurse=False, exclude=[Layer.id, Layer.player_visible]
        )
        data["shapes"] = [
            shape.as_dict(user, dm)
            for shape in self.shapes.order_by(fn.ABS(Shape.index))
        ]
        if self.type_ == "grid":
            type_table = get_table(f"{self.type_}layer")
            data.update(
                **model_to_dict(type_table.get(id=self.id), exclude=[type_table.id])
            )
        return data

    class Meta:
        indexes = ((("location", "name"), True), (("location", "index"), True))


class GridLayer(BaseModel):
    size = FloatField(default=50)
