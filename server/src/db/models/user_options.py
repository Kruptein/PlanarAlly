from typing import Literal, cast, overload

from peewee import BooleanField, FloatField, IntegerField, TextField

from ...api.models.user import ApiOptionalUserOptions, ApiUserOptions
from ..base import BaseDbModel


class UserOptions(BaseDbModel):
    id: int

    fow_colour = cast(str | None, TextField(default="#000", null=True))
    grid_colour = cast(str | None, TextField(default="#000", null=True))
    ruler_colour = cast(str | None, TextField(default="#F00", null=True))
    use_tool_icons = cast(bool | None, BooleanField(default=True, null=True))
    show_token_directions = cast(bool | None, BooleanField(default=True, null=True))
    grid_mode_label_format = cast(int | None, IntegerField(default=0, null=True))
    default_wall_colour = cast(str | None, TextField(default=None, null=True))
    default_window_colour = cast(str | None, TextField(default=None, null=True))
    default_closed_door_colour = cast(str | None, TextField(default=None, null=True))
    default_open_door_colour = cast(str | None, TextField(default=None, null=True))

    invert_alt = cast(bool | None, BooleanField(default=False, null=True))
    disable_scroll_to_zoom = cast(bool | None, BooleanField(default=False, null=True))
    # false = use absolute mode ; true = use relative mode
    default_tracker_mode = cast(bool | None, BooleanField(default=False, null=True))
    # 0 = no pan  1 = middle mouse only  2 = right mouse only 3 = both
    mouse_pan_mode = cast(int | None, IntegerField(default=3, null=True))

    use_high_dpi = cast(bool | None, BooleanField(default=False, null=True))
    grid_size = cast(int | None, IntegerField(default=50, null=True))
    use_as_physical_board = cast(bool | None, BooleanField(default=False, null=True))
    mini_size = cast(float | None, FloatField(default=1, null=True))
    ppi = cast(int | None, IntegerField(default=96, null=True))

    initiative_camera_lock = cast(bool | None, BooleanField(default=False, null=True))
    initiative_vision_lock = cast(bool | None, BooleanField(default=False, null=True))
    initiative_effect_visibility = cast(
        str | None, TextField(default="active", null=True)
    )
    initiative_open_on_activate = cast(
        bool | None, BooleanField(default=True, null=True)
    )

    render_all_floors = cast(bool | None, BooleanField(default=True, null=True))

    @classmethod
    def create_empty(cls):
        return UserOptions.create(
            fow_colour=None,
            grid_colour=None,
            ruler_colour=None,
            use_tool_icons=None,
            show_token_directions=None,
            grid_mode_label_format=None,
            default_wall_colour=None,
            default_window_colour=None,
            default_closed_door_colour=None,
            default_open_door_colour=None,
            invert_alt=None,
            disable_scroll_to_zoom=None,
            default_tracker_mode=None,
            mouse_pan_mode=None,
            use_high_dpi=None,
            grid_size=None,
            use_as_physical_board=None,
            mini_size=None,
            ppi=None,
            initiative_camera_lock=None,
            initiative_vision_lock=None,
            initiative_effect_visibility=None,
            initiative_open_on_activate=None,
            render_all_floors=None,
        )

    @overload
    def as_pydantic(self, optional: Literal[True]) -> ApiOptionalUserOptions: ...

    @overload
    def as_pydantic(self, optional: Literal[False]) -> ApiUserOptions: ...

    @overload
    def as_pydantic(
        self, optional: bool
    ) -> ApiOptionalUserOptions | ApiUserOptions: ...

    def as_pydantic(self, optional: bool):
        target = ApiUserOptions if not optional else ApiOptionalUserOptions

        # I tried with an overload and a generic, but the type system just couldn't infer it :(
        return target(
            fow_colour=self.fow_colour,  # type: ignore
            grid_colour=self.grid_colour,  # type: ignore
            ruler_colour=self.ruler_colour,  # type: ignore
            use_tool_icons=self.use_tool_icons,  # type: ignore
            show_token_directions=self.show_token_directions,  # type: ignore
            grid_mode_label_format=self.grid_mode_label_format,  # type: ignore
            default_wall_colour=self.default_wall_colour,  # type: ignore
            default_window_colour=self.default_window_colour,  # type: ignore
            default_closed_door_colour=self.default_closed_door_colour,  # type: ignore
            default_open_door_colour=self.default_open_door_colour,  # type: ignore
            invert_alt=self.invert_alt,  # type: ignore
            disable_scroll_to_zoom=self.disable_scroll_to_zoom,  # type: ignore
            default_tracker_mode=self.default_tracker_mode,  # type: ignore
            mouse_pan_mode=self.mouse_pan_mode,  # type: ignore
            use_high_dpi=self.use_high_dpi,  # type: ignore
            grid_size=self.grid_size,  # type: ignore
            use_as_physical_board=self.use_as_physical_board,  # type: ignore
            mini_size=self.mini_size,  # type: ignore
            ppi=self.ppi,  # type: ignore
            initiative_camera_lock=self.initiative_camera_lock,  # type: ignore
            initiative_vision_lock=self.initiative_vision_lock,  # type: ignore
            initiative_effect_visibility=self.initiative_effect_visibility,  # type: ignore
            initiative_open_on_activate=self.initiative_open_on_activate,  # type: ignore
            render_all_floors=self.render_all_floors,  # type: ignore
        )
