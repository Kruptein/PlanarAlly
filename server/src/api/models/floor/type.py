from pydantic import BaseModel


class FloorTypeSet(BaseModel):
    name: str
    floorType: int
