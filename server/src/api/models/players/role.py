from pydantic import Field

from ..helpers import TypeIdModel


class PlayerRoleSet(TypeIdModel):
    player: int = Field(json_schema_extra={"typeId": "PlayerId"})
    role: int
