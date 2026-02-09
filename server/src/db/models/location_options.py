from typing import Literal, cast, overload

from peewee import BooleanField, FloatField, TextField

from ...api.models.location import ApiLocationOptions, ApiOptionalLocationOptions
from ..base import BaseDbModel


class LocationOptions(BaseDbModel):
    id: int

    unit_size = cast(float | None, FloatField(default=5, null=True))
    unit_size_unit = cast(str | None, TextField(default="ft", null=True))
    use_grid = cast(bool | None, BooleanField(default=True, null=True))
    grid_mode_ruler_type = cast(str | None, TextField(default="UNCHANGED", null=True))
    full_fow = cast(bool | None, BooleanField(default=False, null=True))
    fow_opacity = cast(float | None, FloatField(default=0.3, null=True))
    fow_los = cast(bool | None, BooleanField(default=False, null=True))
    vision_mode = cast(str | None, TextField(default="triangle", null=True))
    # default is 1km max, 0.5km min
    vision_min_range = cast(float | None, FloatField(default=1640, null=True))
    vision_max_range = cast(float | None, FloatField(default=3281, null=True))
    spawn_locations = cast(str, cast(str, TextField(default="[]")))
    move_player_on_token_change = cast(bool | None, BooleanField(default=True, null=True))
    grid_type = cast(str | None, TextField(default="SQUARE", null=True))
    air_map_background = cast(str | None, TextField(default="none", null=True))
    ground_map_background = cast(str | None, TextField(default="none", null=True))
    underground_map_background = cast(str | None, TextField(default="none", null=True))
    limit_movement_during_initiative = cast(bool | None, BooleanField(default=False, null=True))
    drop_ratio = cast(float | None, FloatField(default=1.0, null=True))

    @classmethod
    def create_empty(cls):
        return LocationOptions.create(
            unit_size=None,
            unit_size_unit=None,
            grid_type=None,
            use_grid=None,
            grid_mode_ruler_type=None,
            full_fow=None,
            fow_opacity=None,
            fow_los=None,
            vision_mode=None,
            vision_min_range=None,
            vision_max_range=None,
            move_player_on_token_change=None,
            air_map_background=None,
            ground_map_background=None,
            underground_map_background=None,
            limit_movement_during_initiative=None,
            drop_ratio=None,
        )

    @overload
    def as_pydantic(self, optional: Literal[True]) -> ApiOptionalLocationOptions: ...

    @overload
    def as_pydantic(self, optional: Literal[False]) -> ApiLocationOptions: ...

    @overload
    def as_pydantic(self, optional: bool) -> ApiOptionalLocationOptions | ApiLocationOptions: ...

    def as_pydantic(self, optional: bool):
        target = ApiLocationOptions if not optional else ApiOptionalLocationOptions

        # I tried with an overload and a generic, but the type system just couldn't infer it :(
        return target(
            unit_size=self.unit_size,  # type: ignore
            unit_size_unit=self.unit_size_unit,  # type: ignore
            grid_type=self.grid_type,  # type: ignore
            use_grid=self.use_grid,  # type: ignore
            grid_mode_ruler_type=self.grid_mode_ruler_type,  # type: ignore
            full_fow=self.full_fow,  # type: ignore
            fow_opacity=self.fow_opacity,  # type: ignore
            fow_los=self.fow_los,  # type: ignore
            vision_mode=self.vision_mode,  # type: ignore
            vision_min_range=self.vision_min_range,  # type: ignore
            vision_max_range=self.vision_max_range,  # type: ignore
            move_player_on_token_change=self.move_player_on_token_change,  # type: ignore
            air_map_background=self.air_map_background,  # type: ignore
            ground_map_background=self.ground_map_background,  # type: ignore
            underground_map_background=self.underground_map_background,  # type: ignore
            limit_movement_during_initiative=self.limit_movement_during_initiative,  # type: ignore
            spawn_locations=self.spawn_locations,
            drop_ratio=self.drop_ratio,  # type: ignore
        )
