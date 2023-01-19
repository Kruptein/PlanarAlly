from pydantic import BaseModel


class InitiativeOrderChange(BaseModel):
    shape: str
    oldIndex: int
    newIndex: int
