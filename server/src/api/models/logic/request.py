from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class LogicDoorRequest(TypeIdModel):
    logic: Literal["door"]
    door: str = Field(json_schema_extra={"typeId": "GlobalId"})


class LogicTeleportRequest(TypeIdModel):
    logic: Literal["tp"]
    fromZone: str = Field(json_schema_extra={"typeId": "GlobalId"})
    toZone: str = Field(json_schema_extra={"typeId": "GlobalId"})
    transfers: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})


class LogicRequestInfo(TypeIdModel):
    requester: int = Field(json_schema_extra={"typeId": "PlayerId"})
    request: LogicDoorRequest | LogicTeleportRequest
