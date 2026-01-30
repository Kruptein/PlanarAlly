from enum import IntEnum

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel

class InitiativeEffectUpdateTiming(IntEnum):
    TurnEnd = 0
    TurnStart = 1

class ApiInitiativeEffect(BaseModel):
    name: str
    turns: str | None
    highlightsActor: bool
    updateTiming: InitiativeEffectUpdateTiming


class InitiativeEffectNew(TypeIdModel):
    actor: str = Field(json_schema_extra={"typeId": "GlobalId"})
    effect: ApiInitiativeEffect
    effect: ApiInitiativeEffect


class InitiativeEffectRename(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    index: int
    name: str


class InitiativeEffectTurns(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    index: int
    turns: str


class InitiativeEffectRemove(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    index: int
