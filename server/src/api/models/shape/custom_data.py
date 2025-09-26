from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class ApiShapeCustomDataIdentifier(TypeIdModel):
    shapeId: str = Field(typeId="GlobalId")
    source: str
    prefix: str
    name: str


class ApiShapeCustomDataCore(ApiShapeCustomDataIdentifier):
    kind: str
    reference: str | None = None
    description: str | None = None


class ApiShapeCustomDataText(ApiShapeCustomDataCore):
    kind: Literal["text"]
    value: str


class ApiShapeCustomDataNumber(ApiShapeCustomDataCore):
    kind: Literal["number"]
    value: float


class ApiShapeCustomDataBoolean(ApiShapeCustomDataCore):
    kind: Literal["boolean"]
    value: bool


class ApiShapeCustomDataDiceExpression(ApiShapeCustomDataCore):
    kind: Literal["dice-expression"]
    value: str


ApiShapeCustomData = (
    ApiShapeCustomDataText | ApiShapeCustomDataNumber | ApiShapeCustomDataBoolean | ApiShapeCustomDataDiceExpression
)
