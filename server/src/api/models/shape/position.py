from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class ShapePosition(BaseModel):
    angle: float
    points: list[tuple[float, float]] = Field(
        json_schema_extra={
            "type": "array",
            "items": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2},
        }
    )


class ShapePositionUpdate(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    position: ShapePosition


class ShapesPositionUpdateList(BaseModel):
    shapes: list[ShapePositionUpdate]
    temporary: bool
