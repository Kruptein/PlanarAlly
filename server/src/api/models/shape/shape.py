from pydantic import Field

from ..aura import ApiAura
from ..helpers import TypeIdModel
from ..tracker import ApiTracker
from .owner import ApiShapeOwner


class ApiCoreShape(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    type_: str
    x: float
    y: float
    # todo: make str | Nullable
    name: str
    name_visible: bool
    fill_colour: str
    stroke_colour: str
    vision_obstruction: int = Field(..., typeId="VisionBlock")
    movement_obstruction: bool
    is_token: bool
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
    asset: int | None = Field(..., noneAsNull=True)
    group: str | None = Field(..., noneAsNull=True)
    ignore_zoom_size: bool
    is_door: bool
    is_teleport_zone: bool
    owners: list[ApiShapeOwner]
    trackers: list[ApiTracker]
    auras: list[ApiAura]
    character: int | None = Field(..., typeId="CharacterId", noneAsNull=True)
    odd_hex_orientation: bool
    size: int
    show_cells: bool
    cell_fill_colour: str | None = Field(..., noneAsNull=True)
    cell_stroke_colour: str | None = Field(..., noneAsNull=True)
    cell_stroke_width: int | None = Field(..., noneAsNull=True)
