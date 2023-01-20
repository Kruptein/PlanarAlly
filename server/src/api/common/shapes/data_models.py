from typing import List, Optional

from typing_extensions import TypedDict

# DATA CLASSES FOR TYPE CHECKING


class ServerTracker(TypedDict):
    uuid: str
    visible: bool
    name: str
    value: int
    maxvalue: int
    draw: bool
    primaryColor: str
    secondaryColor: str


class ServerLabel(TypedDict):
    uuid: str
    category: str
    name: str
    visible: bool
    user: str


class ServerAura(TypedDict):
    uuid: str
    vision_source: bool
    visible: bool
    name: str
    value: int
    dim: int
    colour: str


class ShapeKeys(TypedDict):
    uuid: str
    type_: str
    x: int
    y: int
    index: int
    angle: int
    floor: str
    layer: str
    movement_obstruction: bool
    vision_obstruction: bool
    draw_operator: str
    trackers: List[ServerTracker]
    auras: List[ServerAura]
    labels: List[ServerLabel]
    owners: List[ServerShapeOwner]
    fill_colour: str
    stroke_colour: str
    stroke_width: int
    name: str
    name_visible: bool
    annotation: str
    is_token: bool
    is_invisible: bool
    is_defeated: bool
    options: Optional[str]
    badge: int
    show_badge: bool
    is_locked: bool
    default_edit_access: bool
    default_movement_access: bool
    default_vision_access: bool
