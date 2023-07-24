from typing import Annotated, Literal

from pydantic import Field

from ..helpers import TypeIdModel


class ApiCoreDataBlock(TypeIdModel):
    source: str
    name: str
    category: Literal["general"] | Literal["shape"]
    data: str


class ApiGeneralDataBlock(ApiCoreDataBlock):
    category: Literal["general"]


class ApiShapeDataBlock(ApiCoreDataBlock):
    category: Literal["shape"]
    shape: str = Field(typeId="GlobalId")


ApiDataBlock = Annotated[
    ApiGeneralDataBlock | ApiShapeDataBlock, Field(discriminator="category")
]
