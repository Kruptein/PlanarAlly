from .helpers import TypeIdModel


class PositionTuple(TypeIdModel):
    x: float
    y: float
    floor: str | None = None
