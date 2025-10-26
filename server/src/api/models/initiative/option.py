from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class InitiativeOptionSet(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    option: Literal["isVisible"] | Literal["isGroup"]
    value: bool
    value: bool
