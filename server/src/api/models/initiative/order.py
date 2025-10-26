from pydantic import Field

from ..helpers import TypeIdModel


class InitiativeOrderChange(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    oldIndex: int
    newIndex: int
