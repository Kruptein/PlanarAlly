from typing import Annotated, Literal

from pydantic import Field

from ..helpers import TypeIdModel


class ApiCoreDataBlock(TypeIdModel):
    source: str
    name: str
    category: Literal["room"] | Literal["shape"] | Literal["user"]
    data: str


# RoomDataBlock is always associated with the active room
class ApiRoomDataBlock(ApiCoreDataBlock):
    category: Literal["room"]


class ApiShapeDataBlock(ApiCoreDataBlock):
    category: Literal["shape"]
    shape: str = Field(typeId="GlobalId")


# RoomDataBlock is always associated with the active user
class ApiUserDataBlock(ApiCoreDataBlock):
    category: Literal["user"]


ApiDataBlock = Annotated[
    ApiRoomDataBlock | ApiShapeDataBlock | ApiUserDataBlock,
    Field(discriminator="category"),
]
