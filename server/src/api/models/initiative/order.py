from pydantic import Field

from ..helpers import TypeIdModel


class InitiativeOrderChange(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    oldIndex: int
    newIndex: int
