from .helpers import TypeIdModel


class PositionTuple(TypeIdModel):
    x: float
    y: float


class PositionTupleWithFloor(PositionTuple):
    floor: str
