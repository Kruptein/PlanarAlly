from pydantic import BaseModel, Field
from enum import IntEnum

from ..helpers import TypeIdModel
from .effect import *
from .effect import ApiInitiativeEffect
from .option import *
from .order import *
from .value import *


class InitiativeDirection(IntEnum):
    BACKWARD = -1
    NULL = 0
    FORWARD = 1


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


class InitiativeTurnUpdate(BaseModel):
    turn: int
    direction: int
    processEffects: InitiativeDirection
