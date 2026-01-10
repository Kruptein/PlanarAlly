from pydantic import Field
from pydantic_core import MISSING

from ..client import ClientPosition


class ApiLocationUserOption(ClientPosition):
    active_layer: str | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})
    active_floor: str | MISSING = Field(default=MISSING, json_schema_extra={"missing": True})
