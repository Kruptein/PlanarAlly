from pydantic import Field
from pydantic_core import MISSING

from ..client import OptionalClientViewport
from ..helpers import TypeIdModel
from ..location.userOption import ApiLocationUserOption


class PlayerInfoCore(TypeIdModel):
    id: int = Field(json_schema_extra={"typeId": "PlayerId"})
    name: str
    location: int
    role: int = Field(json_schema_extra={"typeId": "Role"})


class PlayersInfoSet(TypeIdModel):
    core: PlayerInfoCore
    position: ApiLocationUserOption | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})
    clients: list[OptionalClientViewport] | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})
