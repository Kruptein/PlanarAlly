from pydantic import BaseModel, Field

from ..client import OptionalClientViewport
from ..helpers import TypeIdModel
from ..location.userOption import ApiLocationUserOption


class PlayerInfoCore(TypeIdModel):
    id: int = Field(typeId="PlayerId")
    name: str
    location: int
    role: int = Field(typeId="Role")


class PlayersInfoSet(BaseModel):
    core: PlayerInfoCore
    position: ApiLocationUserOption | None = None
    clients: list[OptionalClientViewport] | None = None
