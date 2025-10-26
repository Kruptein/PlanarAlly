from pydantic import Field

from ..helpers import TypeIdModel


class InitiativeValueSet(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    value: int
