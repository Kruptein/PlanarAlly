from pydantic import BaseModel


class ApiLocationOptions(BaseModel):
    unit_size: float
    unit_size_unit: str
    use_grid: bool
    full_fow: bool
    fow_opacity: float
    fow_los: bool
    vision_mode: str
    # default is 1km max, 0.5km min
    vision_min_range: float
    vision_max_range: float
    spawn_locations: str
    move_player_on_token_change: bool
    grid_type: str
    air_map_background: str
    ground_map_background: str
    underground_map_background: str
    limit_movement_during_initiative: bool


class ApiOptionalLocationOptions(BaseModel):
    unit_size: float | None = None
    unit_size_unit: str | None = None
    use_grid: bool | None = None
    full_fow: bool | None = None
    fow_opacity: float | None = None
    fow_los: bool | None = None
    vision_mode: str | None = None
    # default is 1km max, 0.5km min
    vision_min_range: float | None = None
    vision_max_range: float | None = None
    spawn_locations: str | None = None
    move_player_on_token_change: bool | None = None
    grid_type: str | None = None
    air_map_background: str | None = None
    ground_map_background: str | None = None
    underground_map_background: str | None = None
    limit_movement_during_initiative: bool | None = None


class LocationSettingsSet(BaseModel):
    default: ApiLocationOptions
    active: int
    locations: dict[int, ApiOptionalLocationOptions]


class LocationOptionsSet(BaseModel):
    options: ApiOptionalLocationOptions
    location: int | None
