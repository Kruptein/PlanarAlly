from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class ShapePosition(BaseModel):
    angle: int
    points: list[tuple[float, float]]


class ShapePositionUpdate(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    position: ShapePosition


class ShapesPositionUpdateList(BaseModel):
    shapes: list[ShapePositionUpdate]
    temporary: bool
