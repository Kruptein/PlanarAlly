from pydantic import Field

from ..helpers import TypeIdModel


class PlayerRoleSet(TypeIdModel):
    player: int = Field(typeId="PlayerId")
    role: int
