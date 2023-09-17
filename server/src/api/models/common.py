from pydantic import BaseModel


class PositionTuple(BaseModel):
    x: float
    y: float
