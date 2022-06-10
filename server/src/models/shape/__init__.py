from __future__ import annotations
import json
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple, cast
from uuid import uuid4

from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict, update_model_from_dict
from models.typed import SelectSequence

if TYPE_CHECKING:
    from api.socket.shape.data_models import ServerShapeOwner, ShapeKeys

from logs import logger
from ..asset import Asset
from ..base import BaseModel
from ..campaign import Layer
from ..groups import Group
from ..label import Label
from ..user import User


__all__ = [
    "AssetRect",
    "Aura",
    "Circle",
    "CircularToken",
    "Line",
    "Polygon",
    "Rect",
    "Shape",
    "ShapeLabel",
    "ShapeOwner",
    "Text",
    "Tracker",
]


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
    draw_operator = TextField(default="source-over")
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
    stroke_width = IntegerField(default=2)
    asset = ForeignKeyField(Asset, backref="shapes", null=True, default=None)
    group = cast(
        Optional[Group],
        ForeignKeyField(Group, backref="members", null=True, default=None),
    )
    annotation_visible = cast(bool, BooleanField(default=False))
    ignore_zoom_size = BooleanField(default=False)
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
        return dict(json.loads(self.options))

    def set_options(self, options: Dict[str, Any]) -> None:
        self.options = json.dumps([[k, v] for k, v in options.items()])

    # todo: Change this API to accept a PlayerRoom instead
    def as_dict(self, user: User, dm: bool) -> "ShapeKeys":
        data = cast(
            "ShapeKeys",
            {
                k: v
                for k, v in model_to_dict(
                    self, recurse=False, exclude=[Shape.layer, Shape.index]
                ).items()
                if v is not None
            },
        )
        # Owner query > list of usernames
        data["owners"] = [owner.as_dict() for owner in self.owners]
        # Layer query > layer name
        data["layer"] = self.layer.name
        data["floor"] = self.layer.floor.name
        # Aura and Tracker queries > json
        owned = (
            dm
            or self.default_edit_access
            or self.default_vision_access
            or any(user.name == o["user"] for o in data["owners"])
        )
        tracker_query = self.trackers
        aura_query = self.auras
        label_query = self.labels.join(Label)
        if not owned:
            if not self.annotation_visible:
                data["annotation"] = ""
            tracker_query = tracker_query.where(Tracker.visible)
            aura_query = aura_query.where(Aura.visible)
            label_query = label_query.where(Label.visible)
            if not self.name_visible:
                data["name"] = "?"
        data["trackers"] = [t.as_dict() for t in tracker_query]
        data["auras"] = [a.as_dict() for a in aura_query]
        data["labels"] = [l.as_dict() for l in label_query]
        # Subtype
        data.update(**self.subtype.as_dict(exclude=[self.subtype.__class__.shape]))
        return data

    def center_at(self, x: int, y: int) -> None:
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


class ShapeLabel(BaseModel):
    shape = ForeignKeyField(Shape, backref="labels", on_delete="CASCADE")
    label = ForeignKeyField(Label, backref="shapes", on_delete="CASCADE")

    def as_dict(self):
        return self.label.as_dict()

    def make_copy(self, shape):
        ShapeLabel.create(shape=shape, label=self.label.make_copy())


class Tracker(BaseModel):
    uuid = TextField(primary_key=True)
    shape = ForeignKeyField(Shape, backref="trackers", on_delete="CASCADE")
    visible = BooleanField()
    name = TextField()
    value = IntegerField()
    maxvalue = IntegerField()
    draw = BooleanField()
    primary_color = TextField()
    secondary_color = TextField()

    def __repr__(self):
        return f"<Tracker {self.name} {self.shape.get_path()}>"

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[Tracker.shape])

    def make_copy(self, new_shape):
        _dict = self.as_dict()
        _dict["uuid"] = str(uuid4())
        type(self).create(shape=new_shape, **_dict)


class Aura(BaseModel):
    uuid = TextField(primary_key=True)
    shape = ForeignKeyField(Shape, backref="auras", on_delete="CASCADE")
    vision_source = BooleanField()
    visible = BooleanField()
    name = TextField()
    value = IntegerField()
    dim = IntegerField()
    colour = TextField()
    active = BooleanField()
    border_colour = TextField()
    angle = IntegerField()
    direction = IntegerField()

    def __repr__(self):
        return f"<Aura {self.name} {self.shape.get_path()}>"

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[Aura.shape])

    def make_copy(self, new_shape):
        _dict = self.as_dict()
        _dict["uuid"] = str(uuid4())
        type(self).create(shape=new_shape, **_dict)


class ShapeOwner(BaseModel):
    shape = ForeignKeyField(Shape, backref="owners", on_delete="CASCADE")
    user = cast(User, ForeignKeyField(User, backref="shapes", on_delete="CASCADE"))
    edit_access = BooleanField()
    vision_access = BooleanField()
    movement_access = BooleanField()

    def __repr__(self):
        return f"<ShapeOwner {self.user.name} {self.shape.get_path()}>"

    def as_dict(self) -> "ServerShapeOwner":
        return cast(
            "ServerShapeOwner",
            {
                "shape": self.shape.uuid,
                "user": self.user.name,
                "edit_access": self.edit_access,
                "movement_access": self.movement_access,
                "vision_access": self.vision_access,
            },
        )

    def make_copy(self, new_shape):
        _dict = self.as_dict()
        _dict["shape"] = new_shape.uuid
        _dict["user"] = self.user
        type(self).create(**_dict)


class ShapeType(BaseModel):
    shape = ForeignKeyField(Shape, primary_key=True, on_delete="CASCADE")

    @staticmethod
    def pre_create(**kwargs):
        return kwargs

    @staticmethod
    def post_create(subshape, **kwargs):
        """
        Used for special shapes that need extra behaviour after being created.
        """
        pass

    def as_dict(self, *args, **kwargs) -> Dict[Any, Any]:
        return model_to_dict(self, *args, **kwargs)

    def update_from_dict(self, data, *args, **kwargs):
        return update_model_from_dict(self, data, *args, **kwargs)

    def get_center_offset(self, x: int, y: int) -> Tuple[int, int]:
        return 0, 0

    def set_location(self, points: List[List[float]]) -> None:
        logger.error("Attempt to set location on shape without location info")

    def make_copy(self, new_shape):
        table = type(self)
        _dict = self.as_dict(exclude=[table.shape])
        table.create(shape=new_shape, **_dict)


class BaseRect(ShapeType):
    width = cast(float, FloatField())
    height = cast(float, FloatField())

    def get_center_offset(self, x: int, y: int) -> Tuple[float, float]:
        return self.width / 2, self.height / 2


class AssetRect(BaseRect):
    src = TextField()


class Circle(ShapeType):
    radius = cast(float, FloatField())
    viewing_angle = FloatField(null=True)


class CircularToken(Circle):
    text = cast(str, TextField())
    font = TextField()


class Line(ShapeType):
    x2 = FloatField()
    y2 = FloatField()
    line_width = IntegerField()

    def get_center_offset(self, x: int, y: int) -> Tuple[float, float]:
        return (self.x2 - self.x) / 2, (self.y2 - self.y) / 2


class Polygon(ShapeType):
    vertices = TextField()
    line_width = IntegerField()
    open_polygon = BooleanField()

    @staticmethod
    def pre_create(**kwargs):
        kwargs["vertices"] = json.dumps(kwargs["vertices"])
        return kwargs

    def as_dict(self, *args, **kwargs):
        model = model_to_dict(self, *args, **kwargs)
        model["vertices"] = json.loads(model["vertices"])
        return model

    def update_from_dict(self, data, *args, **kwargs):
        data["vertices"] = json.dumps(data["vertices"])
        return update_model_from_dict(self, data, *args, **kwargs)

    def set_location(self, points: List[List[float]]) -> None:
        self.vertices = json.dumps(points)
        self.save()


class Rect(BaseRect):
    pass


class Text(ShapeType):
    text = cast(str, TextField())
    font_size = cast(int, IntegerField())


class ToggleComposite(ShapeType):
    """
    Toggle shapes are composites that have multiple variants but only show one at a time.
    """

    active_variant = cast(Optional[str], TextField(null=True))

    @staticmethod
    def post_create(subshape, **kwargs):
        for variant in kwargs.get("variants", []):
            CompositeShapeAssociation.create(
                parent=subshape, variant=variant["uuid"], name=variant["name"]
            )

    def as_dict(self, *args, **kwargs):
        model = model_to_dict(self, *args, **kwargs)
        model["variants"] = [
            {"uuid": sv.variant.uuid, "name": sv.name}
            for sv in self.shape.shape_variants
        ]
        return model


class CompositeShapeAssociation(BaseModel):
    variant = ForeignKeyField(Shape, backref="composite_parent", on_delete="CASCADE")
    parent = ForeignKeyField(Shape, backref="shape_variants", on_delete="CASCADE")
    name = TextField()
