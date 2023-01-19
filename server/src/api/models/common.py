from pydantic import BaseModel


class PositionTuple(BaseModel):
    x: int
    y: int
