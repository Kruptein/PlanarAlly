from pydantic import BaseModel, Field
from pydantic_core import MISSING

from ..common import PositionTuple
from ..helpers import TypeIdModel
from .settings import *
from .settings import ApiOptionalLocationOptions
from .spawn_info import *
from .userOption import *


class ApiLocationCore(BaseModel):
    id: int
    name: str
    archived: bool


class ApiLocation(ApiLocationCore):
    options: ApiOptionalLocationOptions


class LocationChange(TypeIdModel):
    location: int
    users: list[str]
    position: PositionTuple | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})


class LocationClone(BaseModel):
    location: int
    room: str


class LocationRename(BaseModel):
    location: int
    name: str
