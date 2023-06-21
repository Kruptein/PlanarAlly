from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class LogicDoorRequest(TypeIdModel):
    logic: Literal["door"]
    door: str = Field(typeId="GlobalId")


class LogicTeleportRequest(TypeIdModel):
    logic: Literal["tp"]
    fromZone: str = Field(typeId="GlobalId")
    toZone: str = Field(typeId="GlobalId")
    transfers: list[str] = Field(typeId="GlobalId")


class LogicRequestInfo(TypeIdModel):
    requester: int = Field(typeId="PlayerId")
    request: LogicDoorRequest | LogicTeleportRequest
