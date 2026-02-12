from pydantic import Field

from ...helpers import TypeIdModel


class RoomInfoPlayersAdd(TypeIdModel):
    id: int = Field(json_schema_extra={"typeId": "PlayerId"})
    name: str
    location: int
