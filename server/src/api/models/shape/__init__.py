from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from ..common import PositionTuple
from ..helpers import TypeIdModel
from .custom_data import *
from .options import *
from .owner import *
from .position import *
from .shape import *
from .subtypes import *

if TYPE_CHECKING:
    from .subtypes import ApiShapeSubType


ApiShape = ApiShapeSubType


class ApiShapeWithLayerInfo(TypeIdModel):
    shape: ApiShape
    floor: str
    layer: str = Field(..., typeId="LayerName")


class ShapeAdd(ApiShapeWithLayerInfo):
    temporary: bool


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
    layer: str | None = Field(typeId="LayerName", noneAsNull=True)


class ShapeLocationMove(TypeIdModel):
    shapes: list[str] = Field(typeId="GlobalId")
    target: ShapeLocationMoveTarget


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


# todo: This can probably be removed in favor of the very similar SpawnInfo
class ShapeInfo(BaseModel):
    position: PositionTuple
    floor: str
    location: int
