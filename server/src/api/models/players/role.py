from pydantic import BaseModel


class PlayerRoleSet(BaseModel):
    player: int
    role: int
