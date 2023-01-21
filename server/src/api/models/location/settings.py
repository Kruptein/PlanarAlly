from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


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


class ApiOptionalLocationOptions(TypeIdModel):
    unit_size: float | None = Field(default=None, noneAsNull=True)
    unit_size_unit: str | None = Field(default=None, noneAsNull=True)
    use_grid: bool | None = Field(default=None, noneAsNull=True)
    full_fow: bool | None = Field(default=None, noneAsNull=True)
    fow_opacity: float | None = Field(default=None, noneAsNull=True)
    fow_los: bool | None = Field(default=None, noneAsNull=True)
    vision_mode: str | None = Field(default=None, noneAsNull=True)
    # default is 1km max, 0.5km min
    vision_min_range: float | None = Field(default=None, noneAsNull=True)
    vision_max_range: float | None = Field(default=None, noneAsNull=True)
    spawn_locations: str | None = Field(default=None, noneAsNull=True)
    move_player_on_token_change: bool | None = Field(default=None, noneAsNull=True)
    grid_type: str | None = Field(default=None, noneAsNull=True)
    air_map_background: str | None = Field(default=None, noneAsNull=True)
    ground_map_background: str | None = Field(default=None, noneAsNull=True)
    underground_map_background: str | None = Field(default=None, noneAsNull=True)
    limit_movement_during_initiative: bool | None = Field(default=None, noneAsNull=True)


class LocationSettingsSet(BaseModel):
    default: ApiLocationOptions
    active: int
    locations: dict[int, ApiOptionalLocationOptions]


class LocationOptionsSet(BaseModel):
    options: ApiOptionalLocationOptions
    location: int | None
