from typing import cast

from peewee import FloatField, ForeignKeyField, IntegerField
from pydantic_core import MISSING

from ...api.models.location.userOption import ApiLocationUserOption
from ..base import BaseDbModel
from .layer import Layer
from .location import Location
from .user import User


class LocationUserOption(BaseDbModel):
    id: int

    location = ForeignKeyField(Location, backref="user_options", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="location_options", on_delete="CASCADE")
    pan_x = cast(int, IntegerField(default=0))
    pan_y = cast(int, IntegerField(default=0))
    zoom_display = cast(float, FloatField(default=0.2))
    active_layer = cast(Layer, ForeignKeyField(Layer, backref="active_users", null=True))

    def __repr__(self):
        return f"<LocationUserOption {self.location.get_path()} - {self.user.name}>"

    def as_pydantic(self):
        active_floor = MISSING
        active_layer = MISSING
        if self.active_layer:
            active_layer = self.active_layer.name
            active_floor = self.active_layer.floor.name

        return ApiLocationUserOption(
            pan_x=self.pan_x,
            pan_y=self.pan_y,
            zoom_display=self.zoom_display,
            active_layer=active_layer,
            active_floor=active_floor,
        )

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("location", "user"), True),)
