from typing import Annotated, Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class ApiCoreDataBlock(TypeIdModel):
    source: str
    name: str
    data: str


# RoomDataBlock is always associated with the active room
class ApiRoomDataBlock(ApiCoreDataBlock):
    category: Literal["room"]


class ApiShapeDataBlock(ApiCoreDataBlock):
    category: Literal["shape"]
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})


# RoomDataBlock is always associated with the active user
class ApiUserDataBlock(ApiCoreDataBlock):
    category: Literal["user"]


ApiDataBlock = Annotated[
    ApiRoomDataBlock | ApiShapeDataBlock | ApiUserDataBlock,
    Field(discriminator="category"),
]

# Room DataBlocks only accept "dm" and "room"
# Shape DataBlocks accept all levels, "owner" refers to users with edit access on the shape
# User DataBlocks are always private to the user and have no access configuration
DataBlockAccessLevel = Literal["dm", "owner", "room"]


class ApiDataBlockAccess(BaseModel):
    read: DataBlockAccessLevel
    write: DataBlockAccessLevel


class ApiDataBlockCreate(BaseModel):
    dataBlock: ApiDataBlock
    access: ApiDataBlockAccess | None = None


class ApiDataBlockWithAccess(BaseModel):
    dataBlock: ApiDataBlock
    access: ApiDataBlockAccess | None
