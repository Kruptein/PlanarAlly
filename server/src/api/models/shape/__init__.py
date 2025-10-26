from typing import TYPE_CHECKING

from pydantic import BaseModel, Field
from pydantic_core import MISSING

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
    layer: str = Field(json_schema_extra={"typeId": "LayerName"})


class ShapeAdd(ApiShapeWithLayerInfo):
    temporary: bool


class TemporaryShapes(TypeIdModel):
    uuids: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})
    temporary: bool


class ShapeFloorChange(TypeIdModel):
    uuids: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})
    floor: str


class ShapeLayerChange(ShapeFloorChange):
    layer: str = Field(json_schema_extra={"typeId": "LayerName"})


class ShapeOrder(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    index: int
    temporary: bool


class ShapeLocationMoveTarget(PositionTuple):
    location: int
    floor: str
    layer: str | MISSING = Field(default=MISSING, json_schema_extra={"typeId": "LayerName", "missing": True})


class ShapeLocationMove(TypeIdModel):
    shapes: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})
    target: ShapeLocationMoveTarget


class ShapeTextValueSet(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    text: str
    temporary: bool


class ShapeRectSizeUpdate(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    w: float
    h: float
    temporary: bool


class ShapeCircleSizeUpdate(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    r: float
    temporary: bool


class ShapeTextSizeUpdate(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    font_size: int
    temporary: bool


class ShapeAssetImageSet(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    src: str


# todo: This can probably be removed in favor of the very similar SpawnInfo
class ShapeInfo(BaseModel):
    position: PositionTuple
    floor: str
    location: int
