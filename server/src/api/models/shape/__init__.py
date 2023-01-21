from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from ..common import PositionTuple
from ..helpers import TypeIdModel
from .options import *
from .owner import *
from .position import *
from .shape import *
from .subtypes import *

if TYPE_CHECKING:
    from .shape import ApiCoreShape
    from .subtypes import ApiShapeSubType


ApiShape = ApiShapeSubType

# class ApiShape(BaseModel):
#     core: ApiCoreShape
#     subtype: ApiShapeSubType


class ShapeAdd(BaseModel):
    temporary: bool
    shape: "ApiShape"


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
    location: int
