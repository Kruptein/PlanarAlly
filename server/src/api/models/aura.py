from pydantic import Field

from .helpers import TypeIdModel


class AuraRef(TypeIdModel):
    uuid: str = Field(typeId="AuraId")
    shape: str = Field(typeId="GlobalId")


class AuraMove(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    aura: str = Field(typeId="AuraId")
    new_shape: str = Field(typeId="GlobalId")


class ApiAura(AuraRef):
    vision_source: bool
    visible: bool
    name: str
    value: int
    dim: int
    colour: str
    active: bool
    border_colour: str
    angle: int
    direction: int


class ApiOptionalAura(AuraRef):
    vision_source: bool | None
    visible: bool | None
    name: str | None
    value: int | None
    dim: int | None
    colour: str | None
    active: bool | None
    border_colour: str | None
    angle: int | None
    direction: int | None


class ShapeSetAuraValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: str = Field(typeId="AuraId")
