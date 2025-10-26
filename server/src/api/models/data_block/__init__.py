from typing import Annotated, Literal

from pydantic import Field

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
