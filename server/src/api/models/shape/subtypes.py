from pydantic import Field

from ..helpers import TypeIdModel
from .shape import ApiCoreShape


class ApiBaseRectShape(ApiCoreShape):
    width: float
    height: float


class ApiRectShape(ApiBaseRectShape):
    pass


class ApiAssetRectShape(ApiBaseRectShape):
    src: str


class ApiCircleShape(ApiCoreShape):
    radius: float
    viewing_angle: float | None = Field(..., noneAsNull=True)


class ApiCircularTokenShape(ApiCircleShape):
    text: str
    font: str


class ApiPolygonShape(ApiCoreShape):
    vertices: str
    line_width: int
    open_polygon: bool


class ApiTextShape(ApiCoreShape):
    text: str
    font_size: int


class ApiLineShape(ApiCoreShape):
    x2: float
    y2: float
    line_width: int


class ToggleVariant(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    name: str


class ApiToggleCompositeShape(ApiCoreShape):
    active_variant: str | None = Field(..., typeId="GlobalId", nonAsNull=True)
    variants: list[ToggleVariant]


ApiShapeSubType = (
    ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape
)
