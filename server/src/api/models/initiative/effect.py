from pydantic import BaseModel


class ApiInitiativeEffect(BaseModel):
    name: str
    turns: str
    highlightsActor: bool


class InitiativeEffectNew(BaseModel):
    actor: str
    effect: ApiInitiativeEffect
    effect: ApiInitiativeEffect


class InitiativeEffectRename(BaseModel):
    shape: str
    index: int
    name: str


class InitiativeEffectTurns(BaseModel):
    shape: str
    index: int
    turns: str


class InitiativeEffectRemove(BaseModel):
    shape: str
    index: int
