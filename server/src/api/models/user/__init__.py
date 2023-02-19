from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


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


class ApiOptionalUserOptions(TypeIdModel):
    fow_colour: str | None = Field(defaul=None, noneAsNull=True)
    grid_colour: str | None = Field(defaul=None, noneAsNull=True)
    ruler_colour: str | None = Field(defaul=None, noneAsNull=True)
    use_tool_icons: bool | None = Field(defaul=None, noneAsNull=True)
    show_token_directions: bool | None = Field(defaul=None, noneAsNull=True)

    invert_alt: bool | None = Field(defaul=None, noneAsNull=True)
    disable_scroll_to_zoom: bool | None = Field(defaul=None, noneAsNull=True)
    default_tracker_mode: bool | None = Field(defaul=None, noneAsNull=True)
    mouse_pan_mode: int | None = Field(defaul=None, noneAsNull=True)

    use_high_dpi: bool | None = Field(defaul=None, noneAsNull=True)
    grid_size: int | None = Field(defaul=None, noneAsNull=True)
    use_as_physical_board: bool | None = Field(defaul=None, noneAsNull=True)
    mini_size: float | None = Field(defaul=None, noneAsNull=True)
    ppi: int | None = Field(defaul=None, noneAsNull=True)

    initiative_camera_lock: bool | None = Field(defaul=None, noneAsNull=True)
    initiative_vision_lock: bool | None = Field(defaul=None, noneAsNull=True)
    initiative_effect_visibility: str | None = Field(defaul=None, noneAsNull=True)
    initiative_open_on_activate: bool | None = Field(defaul=None, noneAsNull=True)

    render_all_floors: bool | None = Field(defaul=None, noneAsNull=True)
