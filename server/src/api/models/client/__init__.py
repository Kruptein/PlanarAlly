from pydantic import BaseModel, Field
from pydantic_core import MISSING

from ..helpers import TypeIdModel
from .activeLayer import *
from .offset import *


class ClientPosition(TypeIdModel):
    pan_x: int
    pan_y: int
    zoom_display: float


class Viewport(TypeIdModel):
    height: int
    width: int
    zoom_factor: float
    offset_x: int | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})
    offset_y: int | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})


class OptionalClientViewport(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
    viewport: Viewport | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})


class ClientViewport(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
    viewport: Viewport


class TempClientPosition(BaseModel):
    temp: bool
    position: ClientPosition


class ClientMove(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
    position: ClientPosition


class ClientConnected(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
    player: int = Field(json_schema_extra={"typeId": "PlayerId"})


class ClientDisconnected(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
