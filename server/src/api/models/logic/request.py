from typing import Literal

from pydantic import BaseModel


class LogicDoorRequest(BaseModel):
    logic: Literal["door"]
    door: str


class LogicTeleportRequest(BaseModel):
    logic: Literal["tp"]
    fromZone: str
    toZone: str
    transfers: list[str]


class LogicRequestInfo(BaseModel):
    requester: str
    request: LogicDoorRequest | LogicTeleportRequest
