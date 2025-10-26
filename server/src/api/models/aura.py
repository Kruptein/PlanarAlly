from pydantic import Field
from pydantic_core import MISSING

from .helpers import TypeIdModel


class AuraRef(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "AuraId"})
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})


class AuraMove(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    aura: str = Field(json_schema_extra={"typeId": "AuraId"})
    new_shape: str = Field(json_schema_extra={"typeId": "GlobalId"})


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
    vision_source: bool | MISSING = Field(json_schema_extra={"missing": True})
    visible: bool | MISSING = Field(json_schema_extra={"missing": True})
    name: str | MISSING = Field(json_schema_extra={"missing": True})
    value: int | MISSING = Field(json_schema_extra={"missing": True})
    dim: int | MISSING = Field(json_schema_extra={"missing": True})
    colour: str | MISSING = Field(json_schema_extra={"missing": True})
    active: bool | MISSING = Field(json_schema_extra={"missing": True})
    border_colour: str | MISSING = Field(json_schema_extra={"missing": True})
    angle: int | MISSING = Field(json_schema_extra={"missing": True})
    direction: int | MISSING = Field(json_schema_extra={"missing": True})


class ShapeSetAuraValue(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    value: str = Field(json_schema_extra={"typeId": "AuraId"})
