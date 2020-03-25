import json
from peewee import BooleanField, FloatField, ForeignKeyField, IntegerField, TextField
from playhouse.shortcuts import model_to_dict, update_model_from_dict

from .base import BaseModel
from .campaign import Layer
from .label import Label
from .user import User
from .utils import get_table


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

    def __repr__(self):
        return f"<Shape {self.get_path()}>"

    def get_path(self):
        try:
            return f"{self.name}@{self.layer.get_path()}"
        except:
            return self.name

    def as_dict(self, user: User, dm: bool):
        data = model_to_dict(self, recurse=False, exclude=[Shape.layer, Shape.index])
        # Owner query > list of usernames
        data["owners"] = [
            so.user.name for so in self.owners.select(User.name).join(User)
        ]
        # Layer query > layer name
        data["layer"] = self.layer.name
        data["floor"] = self.layer.floor.name
        # Aura and Tracker queries > json
        owned = dm or (user.name in data["owners"])
        tracker_query = self.trackers
        aura_query = self.auras
        label_query = self.labels.join(Label)
        if not owned:
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

    def __repr__(self):
        return f"<Aura {self.name} {self.shape.get_path()}>"

    def as_dict(self):
        return model_to_dict(self, recurse=False, exclude=[Aura.shape])


class ShapeOwner(BaseModel):
    shape = ForeignKeyField(Shape, backref="owners", on_delete="CASCADE")
    user = ForeignKeyField(User, backref="shapes", on_delete="CASCADE")

    def __repr__(self):
        return f"<ShapeOwner {self.user.name} {self.shape.get_path()}>"


class ShapeType(BaseModel):
    abstract = False
    shape = ForeignKeyField(Shape, primary_key=True, on_delete="CASCADE")

    def as_dict(self, *args, **kwargs):
        return model_to_dict(self, *args, **kwargs)

    def update_from_dict(self, data, *args, **kwargs):
        return update_model_from_dict(self, data, *args, **kwargs)


class BaseRect(ShapeType):
    abstract = False
    width = FloatField()
    height = FloatField()


class AssetRect(BaseRect):
    abstract = False
    src = TextField()


class Circle(ShapeType):
    abstract = False
    radius = FloatField()


class CircularToken(Circle):
    abstract = False
    text = TextField()
    font = TextField()


class Line(ShapeType):
    abstract = False
    x2 = FloatField()
    y2 = FloatField()
    line_width = IntegerField()


class Polygon(ShapeType):
    abstract = False
    vertices = TextField()
    line_width = IntegerField()
    open_polygon = BooleanField()

    def as_dict(self, *args, **kwargs):
        model = model_to_dict(self, *args, **kwargs)
        model["vertices"] = json.loads(model["vertices"])
        return model

    def update_from_dict(self, data, *args, **kwargs):
        data["vertices"] = json.dumps(data["vertices"])
        return update_model_from_dict(self, data, *args, **kwargs)


class Rect(BaseRect):
    abstract = False


class Text(ShapeType):
    abstract = False
    text = TextField()
    font = TextField()
    angle = FloatField()
