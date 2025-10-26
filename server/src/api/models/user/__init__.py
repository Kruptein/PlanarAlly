from pydantic import Field

from ..helpers import TypeIdModel


class ApiUserOptions(TypeIdModel):
    fow_colour: str
    grid_colour: str
    ruler_colour: str
    use_tool_icons: bool
    show_token_directions: bool
    grid_mode_label_format: int = Field(json_schema_extra={"typeId": "GridModeLabelFormat"})
    default_wall_colour: str | None = None
    default_window_colour: str | None = None
    default_closed_door_colour: str | None = None
    default_open_door_colour: str | None = None

    invert_alt: bool
    disable_scroll_to_zoom: bool
    default_tracker_mode: bool
    mouse_pan_mode: int

    use_high_dpi: bool
    grid_size: int
    use_as_physical_board: bool
    mini_size: float
    ppi: int

    initiative_camera_lock: bool
    initiative_vision_lock: bool
    initiative_effect_visibility: str
    initiative_open_on_activate: bool

    render_all_floors: bool


class ApiOptionalUserOptions(TypeIdModel):
    fow_colour: str | None = None
    grid_colour: str | None = None
    ruler_colour: str | None = None
    use_tool_icons: bool | None = None
    show_token_directions: bool | None = None
    grid_mode_label_format: int | None = Field(default=None, json_schema_extra={"typeId": "GridModeLabelFormat"})
    default_wall_colour: str | None = None
    default_window_colour: str | None = None
    default_closed_door_colour: str | None = None
    default_open_door_colour: str | None = None

    invert_alt: bool | None = None
    disable_scroll_to_zoom: bool | None = None
    default_tracker_mode: bool | None = None
    mouse_pan_mode: int | None = None

    use_high_dpi: bool | None = None
    grid_size: int | None = None
    use_as_physical_board: bool | None = None
    mini_size: float | None = None
    ppi: int | None = None

    initiative_camera_lock: bool | None = None
    initiative_vision_lock: bool | None = None
    initiative_effect_visibility: str | None = None
    initiative_open_on_activate: bool | None = None

    render_all_floors: bool | None = None
