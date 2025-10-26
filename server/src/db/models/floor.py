from typing import TYPE_CHECKING, cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ..base import BaseDbModel
from ..typed import SelectSequence
from .location import Location

if TYPE_CHECKING:
    from .layer import Layer


class Floor(BaseDbModel):
    id: int
    layers: SelectSequence["Layer"]

    location = cast(Location, ForeignKeyField(Location, backref="floors", on_delete="CASCADE"))
    index = cast(int, IntegerField())
    name = cast(str, TextField())
    player_visible = cast(bool, BooleanField(default=False))
    type_ = cast(int, IntegerField(default=1))
    background_color = cast(str | None, TextField(default=None, null=True))

    def __repr__(self):
        return f"<Floor {self.name} {[self.index]}>"
