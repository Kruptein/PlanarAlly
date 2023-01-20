from pydantic import BaseModel

from ..aura import ApiAura
from ..helpers import Nullable
from ..label import ApiLabel
from ..tracker import ApiTracker
from .background import *
from .type import *
from .visible import *


class ApiOwner(BaseModel):
    shape: str
    user: str
    edit_access: bool
    movement_access: bool
    vision_access: bool


class ApiShape(BaseModel):
    uuid: str
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
    owners: list[ApiOwner]
    trackers: list[ApiTracker]
    auras: list[ApiAura]
    labels: list[ApiLabel]


class ApiGroup(BaseModel):
    uuid: str
    character_set: str
    creation_order: str


class ApiLayer(BaseModel):
    name: str
    type_: str
    player_editable: bool
    selectable: bool
    index: int
    shapes: list[ApiShape]
    groups: list[ApiGroup]


class ApiFloor(BaseModel):
    index: int
    name: str
    player_visible: bool
    type_: int
    background_color: str | Nullable
    layers: list[ApiLayer]


class FloorCreate(BaseModel):
    floor: ApiFloor
    creator: str


class FloorRename(BaseModel):
    index: int
    name: str
