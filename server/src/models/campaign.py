import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional, Set, cast

from peewee import (
    BooleanField,
    DateField,
    FloatField,
    ForeignKeyField,
    IntegerField,
    TextField,
    fn,
)
from playhouse.shortcuts import model_to_dict

from ..api.models.floor import ApiFloor, ApiGroup, ApiLayer, ApiShape
from ..api.models.helpers import _

if TYPE_CHECKING:
    from .initiative import Initiative
    from .marker import Marker
    from .shape import Shape

from .asset import Asset
from .base import BaseModel
from .typed import SelectSequence
from .user import User, UserOptions

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
    id: int

    unit_size = FloatField(default=5, null=True)
    unit_size_unit = TextField(default="ft", null=True)
    use_grid = BooleanField(default=True, null=True)
    full_fow = cast(bool, BooleanField(default=False, null=True))
    fow_opacity = FloatField(default=0.3, null=True)
    fow_los = cast(bool, BooleanField(default=False, null=True))
    vision_mode = TextField(default="triangle", null=True)
    # default is 1km max, 0.5km min
    vision_min_range = FloatField(default=1640, null=True)
    vision_max_range = FloatField(default=3281, null=True)
    spawn_locations = cast(str, TextField(default="[]"))
    move_player_on_token_change = BooleanField(default=True, null=True)
    grid_type = TextField(default="SQUARE", null=True)
    air_map_background = TextField(default="none", null=True)
    ground_map_background = TextField(default="none", null=True)
    underground_map_background = TextField(default="none", null=True)
    limit_movement_during_initiative = BooleanField(default=False, null=True)

    @classmethod
    def create_empty(cls):
        return LocationOptions.create(
            unit_size=None,
            unit_size_unit=None,
            grid_type=None,
            use_grid=None,
            full_fow=None,
            fow_opacity=None,
            fow_los=None,
            vision_mode=None,
            vision_min_range=None,
            vision_max_range=None,
            move_player_on_token_change=None,
            air_map_background=None,
            ground_map_background=None,
            underground_map_background=None,
            limit_movement_during_initiative=None,
        )

    def as_dict(self):
        return {
            k: v
            for k, v in model_to_dict(
                self, backrefs=False, recurse=False, exclude=[LocationOptions.id]
            ).items()
            if v is not None
        }


class Room(BaseModel):
    id: int
    logo_id: Optional[int]
    players: SelectSequence["PlayerRoom"]
    locations: SelectSequence["Location"]
    default_options: LocationOptions

    name = cast(str, TextField())
    creator = cast(
        User, ForeignKeyField(User, backref="rooms_created", on_delete="CASCADE")
    )
    invitation_code = cast(uuid.UUID, TextField(default=uuid.uuid4, unique=True))
    is_locked = cast(bool, BooleanField(default=False))
    default_options = cast(
        LocationOptions, ForeignKeyField(LocationOptions, on_delete="CASCADE")
    )
    logo = ForeignKeyField(Asset, null=True, on_delete="SET NULL")

    def __repr__(self):
        return f"<Room {self.get_path()}>"

    def get_path(self):
        return f"{self.creator.name}/{self.name}"

    def as_dashboard_dict(self):
        logo = None
        if self.logo_id is not None:
            logo = self.logo.file_hash
        return {
            "name": self.name,
            "creator": self.creator.name,
            "is_locked": self.is_locked,
            "logo": logo,
        }

    class Meta:
        indexes = ((("name", "creator"), True),)


class Location(BaseModel):
    id: int
    floors: SelectSequence["Floor"]
    initiative: List["Initiative"]
    markers: SelectSequence["Marker"]
    players: SelectSequence["PlayerRoom"]
    user_options: List["LocationUserOption"]

    room = ForeignKeyField(Room, backref="locations", on_delete="CASCADE")
    name = cast(str, TextField())
    options = cast(
        Optional[LocationOptions],
        ForeignKeyField(LocationOptions, on_delete="CASCADE", null=True),
    )
    index = cast(int, IntegerField())
    archived = cast(bool, BooleanField(default=False))

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
        if Floor.select().where(Floor.location == self).count() > 0:
            index = (
                Floor.select(fn.Max(Floor.index)).where(Floor.location == self).scalar()
                + 1
            )
        else:
            index = 0
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
    role = cast(int, IntegerField(default=0))
    player = cast(
        User, ForeignKeyField(User, backref="rooms_joined", on_delete="CASCADE")
    )
    room = cast(Room, ForeignKeyField(Room, backref="players", on_delete="CASCADE"))
    active_location = cast(
        Location, ForeignKeyField(Location, backref="players", on_delete="CASCADE")
    )
    user_options = cast(
        Optional[UserOptions],
        ForeignKeyField(UserOptions, on_delete="CASCADE", null=True),
    )
    notes = TextField(null=True)
    last_played = cast(Optional[date], DateField(null=True))

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
    id: int
    layers: SelectSequence["Layer"]

    location = ForeignKeyField(Location, backref="floors", on_delete="CASCADE")
    index = cast(int, IntegerField())
    name = cast(str, TextField())
    player_visible = cast(bool, BooleanField(default=False))
    type_ = cast(int, IntegerField(default=1))
    background_color = cast(Optional[str], TextField(default=None, null=True))

    def __repr__(self):
        return f"<Floor {self.name} {[self.index]}>"

    def as_dict(self, user: User, dm: bool):
        data = model_to_dict(self, recurse=False, exclude=[Floor.id, Floor.location])
        if dm:
            data["layers"] = [
                layer.as_dict(user, True) for layer in self.layers.order_by(Layer.index)
            ]
        else:
            data["layers"] = [
                layer.as_dict(user, False)
                for layer in self.layers.order_by(Layer.index).where(
                    Layer.player_visible
                )
            ]
        return data

    def as_pydantic(self, user: User, dm: bool) -> ApiFloor:
        layers: list[ApiLayer]
        if dm:
            layers = [
                layer.as_pydantic(user, True)
                for layer in self.layers.order_by(Layer.index)
            ]
        else:
            layers = [
                layer.as_pydantic(user, False)
                for layer in self.layers.order_by(Layer.index).where(
                    Layer.player_visible
                )
            ]
        return ApiFloor(
            index=self.index,
            name=self.name,
            player_visible=self.player_visible,
            type_=self.type_,
            background_color=_(self.background_color),
            layers=layers,
        )


class Layer(BaseModel):
    id: int
    shapes: SelectSequence["Shape"]

    floor = ForeignKeyField(Floor, backref="layers", on_delete="CASCADE")
    name = cast(str, TextField())
    type_ = cast(str, TextField())
    # TYPE = IntegerField()  # normal/grid/dm/lighting ???????????
    player_visible = cast(bool, BooleanField(default=False))
    player_editable = cast(bool, BooleanField(default=False))
    selectable = cast(bool, BooleanField(default=True))
    index = cast(int, IntegerField())

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
        groups_added: Set[str] = set()
        data["groups"] = []
        data["shapes"] = []
        for shape in self.shapes.order_by(Shape.index):
            data["shapes"].append(shape.as_dict(user, dm))
            if shape.group and shape.group.uuid not in groups_added:
                groups_added.add(shape.group.uuid)
                data["groups"].append(model_to_dict(shape.group))
        return data

    def as_pydantic(self, user: User, dm: bool) -> ApiLayer:
        from .shape import Shape

        groups_added: Set[str] = set()
        groups: list[ApiGroup] = []
        shapes: list[ApiShape] = []
        for shape in self.shapes.order_by(Shape.index):
            shapes.append(shape.as_pydantic(user, dm))
            if shape.group and shape.group.uuid not in groups_added:
                groups_added.add(shape.group.uuid)
                groups.append(shape.group.as_pydantic())

        return ApiLayer(
            name=self.name,
            type_=self.type_,
            player_editable=self.player_editable,
            selectable=self.selectable,
            index=self.index,
            groups=groups,
            shapes=shapes,
        )

    class Meta:
        indexes = ((("floor", "name"), True), (("floor", "index"), True))


class LocationUserOption(BaseModel):
    id: int

    location = ForeignKeyField(Location, backref="user_options", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="location_options", on_delete="CASCADE")
    pan_x = IntegerField(default=0)
    pan_y = IntegerField(default=0)
    zoom_display = FloatField(default=0.2)
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
