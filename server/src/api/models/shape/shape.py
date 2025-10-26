from pydantic import Field

from ..aura import ApiAura
from ..helpers import TypeIdModel
from ..shape.custom_data import ApiShapeCustomData
from ..tracker import ApiTracker
from .owner import ApiShapeOwner


class ApiCoreShape(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    type_: str
    x: float
    y: float
    # todo: make str | Nullable
    name: str
    name_visible: bool
    fill_colour: str
    stroke_colour: str
    vision_obstruction: int = Field(json_schema_extra={"typeId": "VisionBlock"})
    movement_obstruction: bool
    draw_operator: str
    options: str
    badge: int
    show_badge: bool
    default_edit_access: bool
    default_vision_access: bool
    is_invisible: bool
    is_defeated: bool
    default_movement_access: bool
    is_locked: bool
    angle: float
    stroke_width: int
    asset: int | None
    group: str | None
    ignore_zoom_size: bool
    is_door: bool
    is_teleport_zone: bool
    custom_data: list[ApiShapeCustomData]
    owners: list[ApiShapeOwner]
    trackers: list[ApiTracker]
    auras: list[ApiAura]
    character: int | None = Field(json_schema_extra={"typeId": "CharacterId"})
    odd_hex_orientation: bool
    size: int
    show_cells: bool
    cell_fill_colour: str | None
    cell_stroke_colour: str | None
    cell_stroke_width: int | None
