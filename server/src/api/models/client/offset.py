from pydantic import Field
from pydantic_core import MISSING

from ..helpers import TypeIdModel


class ClientOffsetSet(TypeIdModel):
    client: str = Field(json_schema_extra={"typeId": "ClientId"})
    x: int | MISSING = Field(json_schema_extra={"missing": True})
    y: int | MISSING = Field(json_schema_extra={"missing": True})
