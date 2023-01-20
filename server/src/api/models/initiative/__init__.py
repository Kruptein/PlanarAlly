from pydantic import BaseModel, Field

from ..helpers import TypeIdModel
from .effect import *
from .effect import ApiInitiativeEffect
from .option import *
from .order import *
from .value import *


class ApiInitiativeData(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    initiative: int | None
    isVisible: bool
    isGroup: bool
    effects: list[ApiInitiativeEffect]


class ApiInitiative(BaseModel):
    location: int
    round: int
    turn: int
    sort: int
    data: list[ApiInitiativeData]
    isActive: bool


class InitiativeAdd(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    initiative: int | None
    isVisible: bool
    isGroup: bool
    effects: list[ApiInitiativeEffect]
