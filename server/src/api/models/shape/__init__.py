from pydantic import BaseModel, Field

from ..aura import ApiAura
from ..common import PositionTuple
from ..helpers import Nullable, TypeIdModel
from ..label import ApiLabel
from ..tracker import ApiTracker
from .options import *
from .owner import *
from .owner import ApiShapeOwner
from .position import *


class ApiShape(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    layer: str
    floor: str
    type_: str
    x: float
    y: float
    # todo: make str | Nullable
    name: str
    name_visible: bool
    fill_colour: str
    stroke_colour: str
    vision_obstruction: bool
    movement_obstruction: bool
    is_token: bool
    annotation: str
    draw_operator: str
    options: str
    badge: int
    show_badge: bool
    default_edit_access: bool
    default_vision_access: bool
    is_invisible: bool
    is_defeated: bool
    default_movement_access: bool
    is_locked: bool
    angle: float
    stroke_width: int
    asset: int | Nullable
    group: str | Nullable
    annotation_visible: bool
    ignore_zoom_size: bool
    is_door: bool
    is_teleport_zone: bool
    owners: list[ApiShapeOwner]
    trackers: list[ApiTracker]
    auras: list[ApiAura]
    labels: list[ApiLabel]


class ShapeAdd(BaseModel):
    temporary: bool
    shape: ApiShape


class TemporaryShapes(TypeIdModel):
    uuids: list[str] = Field(typeId="GlobalId")
    temporary: bool


class ShapeFloorChange(TypeIdModel):
    uuids: list[str] = Field(typeId="GlobalId")
    floor: str


class ShapeLayerChange(ShapeFloorChange):
    layer: str = Field(typeId="LayerName")


class ShapeOrder(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    index: int
    temporary: bool


class ShapeLocationMoveTarget(PositionTuple):
    location: int
    floor: str


class ShapeLocationMove(TypeIdModel):
    shapes: list[str] = Field(typeId="GlobalId")
    target: ShapeLocationMoveTarget
    tp_zone: bool


class ShapeTextValueSet(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    text: str
    temporary: bool


class ShapeRectSizeUpdate(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    w: int
    h: int
    temporary: bool


class ShapeCircleSizeUpdate(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    r: int
    temporary: bool


class ShapeTextSizeUpdate(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    font_size: int
    temporary: bool


class ShapeAssetImageSet(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    src: str


class ShapeInfo(BaseModel):
    shape: ApiShape
    location: int
