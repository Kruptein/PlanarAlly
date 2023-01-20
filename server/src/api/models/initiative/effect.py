from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class ApiInitiativeEffect(BaseModel):
    name: str
    turns: str
    highlightsActor: bool


class InitiativeEffectNew(TypeIdModel):
    actor: str = Field(typeId="GlobalId")
    effect: ApiInitiativeEffect
    effect: ApiInitiativeEffect


class InitiativeEffectRename(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    index: int
    name: str


class InitiativeEffectTurns(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    index: int
    turns: str


class InitiativeEffectRemove(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    index: int
