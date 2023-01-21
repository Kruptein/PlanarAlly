from pydantic import BaseModel, Field

from ..helpers import TypeIdModel
from .activeLayer import *
from .gameboard import *
from .offset import *


class ClientPosition(BaseModel):
    pan_x: int
    pan_y: int
    zoom_display: float


class Viewport(BaseModel):
    height: int
    width: int
    zoom_factor: int
    offset_x: int | None
    offset_y: int | None


class OptionalClientViewport(TypeIdModel):
    client: str = Field(typeId="ClientId")
    viewport: Viewport | None = None


class ClientViewport(TypeIdModel):
    client: str = Field(typeId="ClientId")
    viewport: Viewport


class TempClientPosition(BaseModel):
    temp: bool
    position: ClientPosition


class ClientMove(TypeIdModel):
    client: str = Field(typeId="ClientId")
    position: ClientPosition


class ClientConnected(TypeIdModel):
    client: str = Field(typeId="ClientId")
    player: int


class ClientDisconnected(TypeIdModel):
    client: str = Field(typeId="ClientId")
