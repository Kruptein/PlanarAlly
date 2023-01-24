from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, Dict, Optional, cast
from uuid import uuid4

from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiShapeSubType
from ..asset import Asset
from ..base import BaseModel
from ..campaign import Layer
from ..groups import Group
from ..label import Label
from ..typed import SelectSequence
from ..user import User

if TYPE_CHECKING:
    from . import Aura, ShapeLabel, ShapeOwner, Tracker
    from .subtypes import (
        AssetRect,
        Circle,
        CircularToken,
        CompositeShapeAssociation,
        Line,
        Polygon,
        Rect,
        ShapeType,
        Text,
        ToggleComposite,
    )


class Shape(BaseModel):
    labels: SelectSequence["ShapeLabel"]
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

    uuid = cast(str, TextField(primary_key=True))
    layer = cast(Layer, ForeignKeyField(Layer, backref="shapes", on_delete="CASCADE"))
    type_ = cast(str, TextField())
    x = cast(float, FloatField())
    y = cast(float, FloatField())
    name = cast(Optional[str], TextField(null=True))
    name_visible = cast(bool, BooleanField(default=False))
    fill_colour = cast(str, TextField(default="#000"))
    stroke_colour = cast(str, TextField(default="#fff"))
    vision_obstruction = cast(bool, BooleanField(default=False))
    movement_obstruction = cast(bool, BooleanField(default=False))
    is_token = cast(bool, BooleanField(default=False))
    annotation = cast(str, TextField(default=""))
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
        ForeignKeyField(Group, backref="members", null=True, default=None),
    )
    annotation_visible = cast(bool, BooleanField(default=False))
    ignore_zoom_size = cast(bool, BooleanField(default=False))
    is_door = cast(bool, BooleanField(default=False))
    is_teleport_zone = cast(bool, BooleanField(default=False))

    def __repr__(self):
        return f"<Shape {self.get_path()}>"

    def get_path(self):
        try:
            return f"{self.name}@{self.layer.get_path()}"
        except:
            return self.name

    def get_options(self) -> Dict[str, Any]:
        return dict(json.loads(self.options or "[]"))

    def set_options(self, options: Dict[str, Any]) -> None:
        self.options = json.dumps([[k, v] for k, v in options.items()])

    # todo: Change this API to accept a PlayerRoom instead
    def as_pydantic(self, user: User, dm: bool) -> ApiShapeSubType:
        owners = [owner.as_pydantic() for owner in self.owners]
        owned = (
            dm
            or self.default_edit_access
            or self.default_vision_access
            or any(user.name == o.user for o in owners)
        )
        tracker_query = self.trackers
        aura_query = self.auras
        label_query = self.labels.join(Label)
        annotation = self.annotation
        name = self.name
        if not owned:
            if not self.annotation_visible:
                annotation = ""
            tracker_query = tracker_query.where(Tracker.visible)
            aura_query = aura_query.where(Aura.visible)
            label_query = label_query.where(Label.visible)
            if not self.name_visible:
                name = "?"
        trackers = [t.as_pydantic() for t in tracker_query]
        auras = [a.as_pydantic() for a in aura_query]
        labels = [sh_label.label.as_pydantic() for sh_label in label_query]
        # Subtype
        # data.update(**self.subtype.as_pydantic()))
        layer = self.layer
        shape = ApiCoreShape(
            uuid=self.uuid,
            type_=self.type_,
            layer=layer.name,
            floor=layer.floor.name,
            x=self.x,
            y=self.y,
            name=name or "Unknown Shape",
            name_visible=self.name_visible,
            fill_colour=self.fill_colour,
            stroke_colour=self.stroke_colour,
            vision_obstruction=self.vision_obstruction,
            movement_obstruction=self.movement_obstruction,
            is_token=self.is_token,
            annotation=annotation,
            draw_operator=self.draw_operator,
            options=self.options or "[]",
            badge=self.badge,
            show_badge=self.show_badge,
            default_edit_access=self.default_edit_access,
            default_movement_access=self.default_movement_access,
            default_vision_access=self.default_vision_access,
            is_invisible=self.is_invisible,
            is_defeated=self.is_defeated,
            is_locked=self.is_locked,
            angle=self.angle,
            stroke_width=self.stroke_width,
            annotation_visible=self.annotation_visible,
            ignore_zoom_size=self.ignore_zoom_size,
            is_door=self.is_door,
            is_teleport_zone=self.is_teleport_zone,
            asset=None if self.asset is None else self.asset.id,
            group=None if self.group is None else self.group.uuid,
            owners=owners,
            trackers=trackers,
            auras=auras,
            labels=labels,
        )
        return self.subtype.as_pydantic(shape)

    def center_at(self, x: float, y: float) -> None:
        x_off, y_off = self.subtype.get_center_offset(x, y)
        self.x = x - x_off
        self.y = y - y_off

    @property
    def subtype(self) -> ShapeType:
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
            annotation=self.annotation,
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
            annotation_visible=self.annotation_visible,
            ignore_zoom_size=self.ignore_zoom_size,
        )

        self.subtype.make_copy(new_shape)

        for aura in self.auras:
            aura.make_copy(new_shape)

        for tracker in self.trackers:
            tracker.make_copy(new_shape)

        for label in self.labels:
            label.make_copy(new_shape)

        for owner in self.owners:
            owner.make_copy(new_shape)

        return new_shape
