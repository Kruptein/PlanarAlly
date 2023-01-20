from typing import List, Optional

from typing_extensions import Literal, TypedDict


# DATA CLASSES FOR TYPE CHECKING
class PositionTuple(TypedDict):
    angle: int
    points: List[List[float]]


class PositionUpdate(TypedDict):
    uuid: str
    position: PositionTuple


class PositionUpdateList(TypedDict):
    shapes: List[PositionUpdate]
    temporary: bool


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


class ShapeAdd(TypedDict):
    shape: ShapeKeys
    temporary: bool


class TemporaryShapesList(TypedDict):
    uuids: List[str]
    temporary: bool


class ShapeOrder(TypedDict):
    uuid: str
    index: int
    temporary: bool


class ShapeFloorChange(TypedDict):
    uuids: List[str]
    floor: str


class ServerShapeLocationMoveTarget(TypedDict):
    location: int
    floor: str
    x: int
    y: int


class ServerShapeLocationMove(TypedDict):
    shapes: List[str]
    target: ServerShapeLocationMoveTarget
    tp_zone: bool


class GroupMemberAddData(TypedDict):
    leader: str
    member: str


class TrackerUpdateData(TypedDict):
    uuid: str
    shape: str
    value: str
    _type: Literal["aura", "tracker"]


class TextUpdateData(TypedDict):
    uuid: str
    text: str
    temporary: bool


class RectSizeData(TypedDict):
    uuid: str
    w: int
    h: int
    temporary: bool


class CircleSizeData(TypedDict):
    uuid: str
    r: int
    temporary: bool


class TextSizeData(TypedDict):
    uuid: str
    font_size: int
    temporary: bool


class AssetRectImageData(TypedDict):
    uuid: str
    src: str


class OptionUpdate(TypedDict):
    uuid: str
    option: str


class OptionUpdateList(TypedDict):
    options: List[OptionUpdate]
    temporary: bool
    options: List[OptionUpdate]
    temporary: bool
