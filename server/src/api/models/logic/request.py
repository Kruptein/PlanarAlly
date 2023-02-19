from typing import Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class LogicDoorRequest(TypeIdModel):
    logic: Literal["door"]
    door: str = Field(typeId="GlobalId")


class LogicTeleportRequest(TypeIdModel):
    logic: Literal["tp"]
    fromZone: str = Field(typeId="GlobalId")
    toZone: str = Field(typeId="GlobalId")
    transfers: list[str]


class LogicRequestInfo(BaseModel):
    requester: str
    request: LogicDoorRequest | LogicTeleportRequest
