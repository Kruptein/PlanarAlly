from pydantic import Field

from ..helpers import TypeIdModel


class ToggleCompositeVariant(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    variant: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ToggleCompositeNewVariant(ToggleCompositeVariant):
    name: str
