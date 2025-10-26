from enum import IntEnum

from pydantic import BaseModel, Field
from pydantic_core import MISSING

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
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    initiative: int | MISSING = Field(json_schema_extra={"missing": True})
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
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    initiative: int | MISSING = Field(json_schema_extra={"missing": True})
    isVisible: bool
    isGroup: bool
    effects: list[ApiInitiativeEffect]


class InitiativeTurnUpdate(BaseModel):
    turn: int
    direction: InitiativeDirection
    processEffects: bool


class InitiativeRoundUpdate(BaseModel):
    round: int
    direction: InitiativeDirection
    processEffects: bool
