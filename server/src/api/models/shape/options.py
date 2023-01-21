from typing import Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class ShapeOption(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    option: str


class ShapesOptionsUpdate(BaseModel):
    options: list[ShapeOption]
    temporary: bool


class ShapeSetBooleanValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: bool


class ShapeSetStringValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: str


class ShapeSetOptionalStringValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: str | None = Field(..., noneAsNull=True)


class Permissions(BaseModel):
    enabled: list[str]
    request: list[str]
    disabled: list[str]


class ShapeSetPermissionValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: Permissions


class ShapeSetDoorToggleModeValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: Literal["movement"] | Literal["vision"] | Literal["both"]


class TeleportLocation(TypeIdModel):
    id: int
    spawnUuid: str = Field(typeId="GlobalId")


class ShapeSetTeleportLocationValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: TeleportLocation
    value: TeleportLocation
