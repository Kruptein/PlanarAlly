from pydantic import BaseModel


class ApiUserOptions(BaseModel):
    fow_colour: str
    grid_colour: str
    ruler_colour: str
    use_tool_icons: bool
    show_token_directions: bool

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


class ApiOptionalUserOptions(BaseModel):
    fow_colour: str | None
    grid_colour: str | None
    ruler_colour: str | None
    use_tool_icons: bool | None
    show_token_directions: bool | None

    invert_alt: bool | None
    disable_scroll_to_zoom: bool | None
    default_tracker_mode: bool | None
    mouse_pan_mode: int | None

    use_high_dpi: bool | None
    grid_size: int | None
    use_as_physical_board: bool | None
    mini_size: float | None
    ppi: int | None

    initiative_camera_lock: bool | None
    initiative_vision_lock: bool | None
    initiative_effect_visibility: str | None
    initiative_open_on_activate: bool | None

    render_all_floors: bool | None
