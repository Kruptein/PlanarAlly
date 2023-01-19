from pydantic import BaseModel

from ..common import PositionTuple
from .settings import *
from .settings import ApiOptionalLocationOptions
from .userOption import *


class ApiLocationCore(BaseModel):
    id: int
    name: str
    archived: bool


class ApiLocation(ApiLocationCore):
    options: ApiOptionalLocationOptions


class LocationChange(BaseModel):
    location: int
    users: list[str]
    position: PositionTuple | None


class LocationClone(BaseModel):
    location: int
    room: str


class LocationRename(BaseModel):
    location: int
    name: str
