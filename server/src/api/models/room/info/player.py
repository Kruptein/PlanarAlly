from pydantic import Field

from ...helpers import TypeIdModel


class RoomInfoPlayersAdd(TypeIdModel):
    id: int = Field(typeId="PlayerId")
    name: str
    location: int
