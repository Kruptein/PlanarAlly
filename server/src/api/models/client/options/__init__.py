from pydantic import BaseModel


class ClientOptionsSet(BaseModel):
    grid_colour: str | None
    fow_colour: str | None
    ruler_colour: str | None

    invert_alt: bool | None
    disable_scroll_to_zoom: bool | None

    use_high_dpi: bool | None
    grid_size: int | None
    use_as_physical_board: bool | None
    mini_size: int | None
    ppi: int | None

    initiative_camera_lock: bool | None
    initiative_vision_lock: bool | None
    initiative_effect_visibility: int | None
