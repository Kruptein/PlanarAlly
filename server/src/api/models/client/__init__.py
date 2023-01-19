from pydantic import BaseModel

from .activeLayer import *
from .gameboard import *
from .offset import *
from .options import *


class ClientPosition(BaseModel):
    pan_x: int
    pan_y: int
    zoom_display: int


class Viewport(BaseModel):
    height: int
    width: int
    zoom_factor: int
    offset_x: int | None
    offset_y: int | None


class ClientViewport(BaseModel):
    client: str
    viewport: Viewport


class TempClientPosition(BaseModel):
    temp: bool
    position: ClientPosition


class ClientMove(BaseModel):
    client: str
    position: ClientPosition


class ClientConnected(BaseModel):
    client: str
    player: int


class ClientDisconnected(BaseModel):
    client: str
