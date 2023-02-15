from typing import TYPE_CHECKING, List, Optional, cast

import bcrypt
from peewee import (
    BooleanField,
    FloatField,
    ForeignKeyField,
    IntegerField,
    TextField,
    fn,
)
from playhouse.shortcuts import model_to_dict

from .base import BaseModel
from .typed import SelectSequence

if TYPE_CHECKING:
    from .campaign import PlayerRoom, Room
    from .label import Label


__all__ = ["User", "UserOptions"]


class UserOptions(BaseModel):
    id: int

    fow_colour = TextField(default="#000", null=True)
    grid_colour = TextField(default="#000", null=True)
    ruler_colour = TextField(default="#F00", null=True)
    use_tool_icons = BooleanField(default=True, null=True)
    show_token_directions = BooleanField(default=True, null=True)

    invert_alt = BooleanField(default=False, null=True)
    disable_scroll_to_zoom = BooleanField(default=False, null=True)
    # false = use absolute mode ; true = use relative mode
    default_tracker_mode = BooleanField(default=False, null=True)
    # 0 = no pan  1 = middle mouse only  2 = right mouse only 3 = both
    mouse_pan_mode = IntegerField(default=3, null=True)

    use_high_dpi = BooleanField(default=False, null=True)
    grid_size = IntegerField(default=50, null=True)
    use_as_physical_board = BooleanField(default=False, null=True)
    mini_size = FloatField(default=1, null=True)
    ppi = IntegerField(default=96, null=True)

    initiative_camera_lock = BooleanField(default=False, null=True)
    initiative_vision_lock = BooleanField(default=False, null=True)
    initiative_effect_visibility = TextField(default="active", null=True)
    initiative_open_on_activate = cast(bool, BooleanField(default=True, null=True))

    render_all_floors = BooleanField(default=True, null=True)

    @classmethod
    def create_empty(cls):
        return UserOptions.create(
            fow_colour=None,
            grid_colour=None,
            ruler_colour=None,
            use_tool_icons=None,
            show_token_directions=None,
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

    def as_dict(self):
        return {
            k: v
            for k, v in model_to_dict(
                self, backrefs=False, recurse=False, exclude=[UserOptions.id]
            ).items()
            if v is not None
        }


class User(BaseModel):
    id: int
    labels: List["Label"]
    rooms_created: SelectSequence["Room"]
    rooms_joined: SelectSequence["PlayerRoom"]

    name = cast(str, TextField())
    email = TextField(null=True)
    password_hash = cast(str, TextField())
    default_options = ForeignKeyField(UserOptions, on_delete="CASCADE")

    colour_history = cast(Optional[str], TextField(null=True))

    def __repr__(self):
        return f"<User {self.name}>"

    def set_password(self, pw: str):
        pwhash = bcrypt.hashpw(pw.encode("utf8"), bcrypt.gensalt())
        self.password_hash = pwhash.decode("utf8")

    def check_password(self, pw: str):
        if self.password_hash is None:
            return False
        expected_hash = self.password_hash.encode("utf8")
        return bcrypt.checkpw(pw.encode("utf8"), expected_hash)

    def as_dict(self):
        return model_to_dict(
            self,
            recurse=False,
            exclude=[User.id, User.password_hash, User.default_options],
        )

    @classmethod
    def by_name(cls, name: str) -> "User":
        return cls.get_or_none(fn.Lower(cls.name) == name.lower())

    @classmethod
    def create_new(cls, name: str, password: str, email: Optional[str] = None):
        u = User(name=name)
        u.set_password(password)
        if email:
            u.email = email
        default_options = UserOptions()
        default_options.save()
        u.default_options = default_options
        u.save()
