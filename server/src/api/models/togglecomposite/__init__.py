from pydantic import Field

from ..helpers import TypeIdModel


class ToggleCompositeVariant(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    variant: str = Field(typeId="GlobalId")


class ToggleCompositeNewVariant(ToggleCompositeVariant):
    name: str
