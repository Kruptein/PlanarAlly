from pydantic import BaseModel

from ..client import OptionalClientViewport
from ..location.userOption import ApiLocationUserOption


class PlayerInfoCore(BaseModel):
    id: int
    name: str
    location: int
    role: int


class PlayersInfoSet(BaseModel):
    core: PlayerInfoCore
    position: ApiLocationUserOption | None = None
    clients: list[OptionalClientViewport] | None = None
