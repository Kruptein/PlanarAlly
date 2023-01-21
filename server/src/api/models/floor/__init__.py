from pydantic import BaseModel, Field

from ..helpers import TypeIdModel
from ..shape import ApiShape
from .background import *
from .type import *
from .visible import *


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


class ApiFloor(TypeIdModel):
    index: int
    name: str
    player_visible: bool
    type_: int
    background_color: str | None = Field(..., noneAsNull=True)
    layers: list[ApiLayer]


class FloorCreate(BaseModel):
    floor: ApiFloor
    creator: str


class FloorRename(BaseModel):
    index: int
    name: str
