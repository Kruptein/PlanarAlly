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
    viewing_angle: float | None


class ApiCircularTokenShape(ApiCircleShape):
    text: str
    font: str


class ApiPolygonShape(ApiCoreShape):
    vertices: str
    line_width: int
    open_polygon: bool


class ApiTextShape(ApiCoreShape):
    text: str
    font_size: float


class ApiLineShape(ApiCoreShape):
    x2: float
    y2: float
    line_width: float


ApiShapeSubType = (
    ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
)
