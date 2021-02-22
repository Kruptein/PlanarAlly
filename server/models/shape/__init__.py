import json

from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict, update_model_from_dict
from typing import Any, Dict, List, Tuple

from utils import logger
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
    uuid = TextField(primary_key=True)
    layer = ForeignKeyField(Layer, backref="shapes", on_delete="CASCADE")
    type_ = TextField()
    x = FloatField()
    y = FloatField()
    name = TextField(null=True)
    name_visible = BooleanField(default=True)
    fill_colour = TextField(default="#000")
    stroke_colour = TextField(default="#fff")
    vision_obstruction = BooleanField(default=False)
    movement_obstruction = BooleanField(default=False)
    is_token = BooleanField(default=False)
    annotation = TextField(default="")
    draw_operator = TextField(default="source-over")
    index = IntegerField()
    options = TextField(null=True)
    badge = IntegerField(default=1)
    show_badge = BooleanField(default=False)
    default_edit_access = BooleanField(default=False)
    default_vision_access = BooleanField(default=False)
    is_invisible = BooleanField(default=False)
    is_defeated = BooleanField(default=False)
    default_movement_access = BooleanField(default=False)
    is_locked = BooleanField(default=False)
    angle = FloatField(default=0)
    stroke_width = IntegerField(default=2)
    asset = ForeignKeyField(Asset, backref="shapes", null=True, default=None)
    group = ForeignKeyField(Group, backref="members", null=True, default=None)
    annotation_visible = BooleanField(default=False)
    ignore_zoom_size = BooleanField(default=False)

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
    def as_dict(self, user: User, dm: bool):
        data = model_to_dict(self, recurse=False, exclude=[Shape.layer, Shape.index])
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
    def subtype(self):
        return getattr(self, f"{self.type_}_set").get()


class ShapeLabel(BaseModel):
    shape = ForeignKeyField(Shape, backref="labels", on_delete="CASCADE")
    label = ForeignKeyField(Label, backref="shapes", on_delete="CASCADE")

    def as_dict(self):
        return self.label.as_dict()


class Tracker(BaseModel):
    uuid = TextField(primary_key=True)
    shape = ForeignKeyField(Shape, backref="trackers", on_delete="CASCADE")
    visible = BooleanField()
    name = TextField()
    value = IntegerField()
    maxvalue = IntegerField()

    def __repr__(self):
        return f"<Tracker {self.name} {self.shape.get_path()}>"

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[Tracker.shape])


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


class ShapeOwner(BaseModel):
    shape = ForeignKeyField(Shape, backref="owners", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="shapes", on_delete="CASCADE")
    edit_access = BooleanField()
    vision_access = BooleanField()
    movement_access = BooleanField()

    def __repr__(self):
        return f"<ShapeOwner {self.user.name} {self.shape.get_path()}>"

    def as_dict(self):
        return {
            "shape": self.shape.uuid,
            "user": self.user.name,
            "edit_access": self.edit_access,
            "movement_access": self.movement_access,
            "vision_access": self.vision_access,
        }


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

    def as_dict(self, *args, **kwargs):
        return model_to_dict(self, *args, **kwargs)

    def update_from_dict(self, data, *args, **kwargs):
        return update_model_from_dict(self, data, *args, **kwargs)

    def get_center_offset(self, x: int, y: int) -> Tuple[int, int]:
        return 0, 0

    def set_location(self, points: List[List[int]]) -> None:
        logger.error("Attempt to set location on shape without location info")


class BaseRect(ShapeType):
    width = FloatField()
    height = FloatField()

    def get_center_offset(self, x: int, y: int) -> Tuple[int, int]:
        return self.width / 2, self.height / 2


class AssetRect(BaseRect):
    src = TextField()


class Circle(ShapeType):
    radius = FloatField()
    viewing_angle = FloatField(null=True)


class CircularToken(Circle):
    text = TextField()
    font = TextField()


class Line(ShapeType):
    x2 = FloatField()
    y2 = FloatField()
    line_width = IntegerField()

    def get_center_offset(self, x: int, y: int) -> Tuple[int, int]:
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

    def set_location(self, points: List[List[int]]) -> None:
        self.vertices = json.dumps(points)
        self.save()


class Rect(BaseRect):
    pass


class Text(ShapeType):
    text = TextField()
    font_size = IntegerField()


class ToggleComposite(ShapeType):
    """
    Toggle shapes are composites that have multiple variants but only show one at a time.
    """

    active_variant = TextField(null=True)

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
