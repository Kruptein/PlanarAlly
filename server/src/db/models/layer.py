from typing import TYPE_CHECKING, cast

from peewee import BooleanField, ForeignKeyField, IntegerField, TextField

from ..base import BaseDbModel
from ..typed import SelectSequence
from .floor import Floor

if TYPE_CHECKING:
    from .shape import Shape


class Layer(BaseDbModel):
    id: int
    shapes: SelectSequence["Shape"]

    floor = cast(Floor, ForeignKeyField(Floor, backref="layers", on_delete="CASCADE"))
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

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("floor", "name"), True), (("floor", "index"), True))
