import json
from typing import TYPE_CHECKING, Any, Dict, Optional, cast
from uuid import uuid4

from peewee import (
    BooleanField,
    FloatField,
    ForeignKeyField,
    IntegerField,
    SmallIntegerField,
    TextField,
)

from ...api.models.common import PositionTuple
from ..base import BaseDbModel
from ..typed import SelectSequence
from .asset import Asset
from .character import Character
from .group import Group
from .layer import Layer

if TYPE_CHECKING:
    from .asset_rect import AssetRect
    from .aura import Aura
    from .circle import Circle
    from .circular_token import CircularToken
    from .composite_shape_association import CompositeShapeAssociation
    from .line import Line
    from .polygon import Polygon
    from .rect import Rect
    from .shape_data_block import ShapeDataBlock
    from .shape_owner import ShapeOwner
    from .shape_type import ShapeType
    from .text import Text
    from .toggle_composite import ToggleComposite
    from .tracker import Tracker


class Shape(BaseDbModel):
    trackers: SelectSequence["Tracker"]
    auras: SelectSequence["Aura"]
    owners: SelectSequence["ShapeOwner"]
    assetrect_set: SelectSequence["AssetRect"]
    circle_set: SelectSequence["Circle"]
    circulartoken_set: SelectSequence["CircularToken"]
    line_set: SelectSequence["Line"]
    polygon_set: SelectSequence["Polygon"]
    rect_set: SelectSequence["Rect"]
    text_set: SelectSequence["Text"]
    togglecomposite_set: SelectSequence["ToggleComposite"]
    composite_parent: SelectSequence["CompositeShapeAssociation"]
    shape_variants: SelectSequence["CompositeShapeAssociation"]
    character_id: int | None
    data_blocks: SelectSequence["ShapeDataBlock"]

    uuid = cast(str, TextField(primary_key=True))
    layer = cast(
        Layer | None,
        ForeignKeyField(Layer, backref="shapes", on_delete="CASCADE", null=True),
    )
    type_ = cast(str, TextField())
    x = cast(float, FloatField())
    y = cast(float, FloatField())
    name = cast(Optional[str], TextField(null=True))
    name_visible = cast(bool, BooleanField(default=False))
    fill_colour = cast(str, TextField(default="#000"))
    stroke_colour = cast(str, TextField(default="#fff"))
    vision_obstruction = cast(int, SmallIntegerField(default=False))
    movement_obstruction = cast(bool, BooleanField(default=False))
    is_token = cast(bool, BooleanField(default=False))
    draw_operator = cast(str, TextField(default="source-over"))
    index = cast(int, IntegerField())
    options = cast(Optional[str], TextField(null=True))
    badge = cast(int, IntegerField(default=1))
    show_badge = cast(bool, BooleanField(default=False))
    default_edit_access = cast(bool, BooleanField(default=False))
    default_vision_access = cast(bool, BooleanField(default=False))
    is_invisible = cast(bool, BooleanField(default=False))
    is_defeated = cast(bool, BooleanField(default=False))
    default_movement_access = cast(bool, BooleanField(default=False))
    is_locked = cast(bool, BooleanField(default=False))
    angle = cast(float, FloatField(default=0))
    stroke_width = cast(int, IntegerField(default=2))
    asset = cast(
        Optional[Asset],
        ForeignKeyField(
            Asset, backref="shapes", null=True, default=None, on_delete="SET NULL"
        ),
    )
    group = cast(
        Optional[Group],
        ForeignKeyField(
            Group, backref="members", null=True, default=None, on_delete="SET NULL"
        ),
    )
    ignore_zoom_size = cast(bool, BooleanField(default=False))
    is_door = cast(bool, BooleanField(default=False))
    is_teleport_zone = cast(bool, BooleanField(default=False))
    character = cast(
        Character | None,
        ForeignKeyField(
            Character, backref="shapes", null=True, default=None, on_delete="SET NULL"
        ),
    )
    odd_hex_orientation = cast(bool, BooleanField(default=False))
    size = cast(int, IntegerField(default=0))
    show_cells = cast(bool, BooleanField(default=False))
    cell_fill_colour = cast(str, TextField(null=True, default=None))
    cell_stroke_colour = cast(str, TextField(null=True, default=None))
    cell_stroke_width = cast(int, IntegerField(null=True, default=None))

    def __repr__(self):
        return f"<Shape {self.get_path()}>"

    def get_path(self):
        if self.layer:
            return f"{self.name}@{self.layer.get_path()}"
        else:
            return self.name

    def get_options(self) -> Dict[str, Any]:
        return dict(json.loads(self.options or "[]"))

    def set_options(self, options: Dict[str, Any]) -> None:
        self.options = json.dumps([[k, v] for k, v in options.items()])

    @property
    def center(self) -> PositionTuple:
        x_off, y_off = self.subtype.get_center_offset()
        return PositionTuple(x=self.x + x_off, y=self.y + y_off)

    @center.setter
    def center(self, center: PositionTuple):
        x_off, y_off = self.subtype.get_center_offset()
        self.x = center.x - x_off
        self.y = center.y - y_off

    @property
    def subtype(self) -> "ShapeType":
        return getattr(self, f"{self.type_}_set").get()

    def make_copy(self, dst_layer, new_group):
        new_shape = Shape.create(
            uuid=str(uuid4()),
            layer=dst_layer,
            type_=self.type_,
            x=self.x,
            y=self.y,
            name=self.name,
            name_visible=self.name_visible,
            fill_colour=self.fill_colour,
            stroke_colour=self.stroke_colour,
            vision_obstruction=self.vision_obstruction,
            movement_obstruction=self.movement_obstruction,
            is_token=self.is_token,
            draw_operator=self.draw_operator,
            index=self.index,
            options=self.options,
            badge=self.badge,
            show_badge=self.show_badge,
            default_edit_access=self.default_edit_access,
            default_vision_access=self.default_vision_access,
            is_invisible=self.is_invisible,
            is_defeated=self.is_defeated,
            default_movement_access=self.default_movement_access,
            is_locked=self.is_locked,
            angle=self.angle,
            stroke_width=self.stroke_width,
            asset=self.asset,
            group=new_group,
            ignore_zoom_size=self.ignore_zoom_size,
        )

        self.subtype.make_copy(new_shape)

        for aura in self.auras:
            aura.make_copy(new_shape)

        for tracker in self.trackers:
            tracker.make_copy(new_shape)

        for owner in self.owners:
            owner.make_copy(new_shape)

        return new_shape
