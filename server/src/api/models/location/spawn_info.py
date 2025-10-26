from pydantic import Field

from ..common import PositionTuple
from ..helpers import TypeIdModel


class ApiSpawnInfo(TypeIdModel):
    position: PositionTuple
    floor: str
    name: str
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
