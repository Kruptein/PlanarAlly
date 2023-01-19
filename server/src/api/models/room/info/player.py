from pydantic import BaseModel


class RoomInfoPlayersAdd(BaseModel):
    id: int
    name: str
    location: int
