from pydantic import Field

from ..helpers import TypeIdModel


class InitiativeValueSet(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: int
