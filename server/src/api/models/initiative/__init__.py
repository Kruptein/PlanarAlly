from pydantic import BaseModel

from .effect import *
from .effect import ApiInitiativeEffect
from .option import *
from .order import *
from .value import *


class ApiInitiativeData(BaseModel):
    shape: str
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


class InitiativeAdd(BaseModel):
    shape: str
    initiative: int | None
    isVisible: bool
    isGroup: bool
    effects: list[ApiInitiativeEffect]
