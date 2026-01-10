from pydantic import Field
from pydantic_core import MISSING

from ..helpers import TypeIdModel


class FloorBackgroundSet(TypeIdModel):
    name: str
    background: str | MISSING = Field(json_schema_extra={"missing": True})
