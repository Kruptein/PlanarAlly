from datetime import date
from typing import TYPE_CHECKING, cast

import bcrypt
from peewee import DateField, ForeignKeyField, TextField, fn
from playhouse.shortcuts import model_to_dict
from typing_extensions import Self

from ...utils import ASSETS_DIR, get_asset_hash_subpath
from ..base import BaseDbModel
from ..typed import SelectSequence
from .user_options import UserOptions

if TYPE_CHECKING:
    from .asset_entry import AssetEntry
    from .player_room import PlayerRoom
    from .room import Room


class User(BaseDbModel):
    id: int
    asset_entries: SelectSequence["AssetEntry"]
    rooms_created: SelectSequence["Room"]
    rooms_joined: SelectSequence["PlayerRoom"]

    name = cast(str, TextField(unique=True))
    email = TextField(null=True)
    password_hash = cast(str, TextField())
    default_options = cast(UserOptions, ForeignKeyField(UserOptions, on_delete="CASCADE"))

    colour_history = cast(str | None, TextField(null=True))

    last_login = cast(date, DateField(null=True))

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

    def get_total_asset_size(self) -> int:
        handled_assets = set[int]()
        total_size = 0
        for asset in self.asset_entries:
            if asset.asset and asset.asset.id not in handled_assets:
                if asset.asset.file_hash and (ASSETS_DIR / get_asset_hash_subpath(asset.asset.file_hash)).exists():
                    total_size += (ASSETS_DIR / get_asset_hash_subpath(asset.asset.file_hash)).stat().st_size
                    handled_assets.add(asset.asset.id)
        return total_size

    def update_last_login(self):
        today = date.today()
        if self.last_login != today:
            self.last_login = today
            self.save()

    @classmethod
    def by_name(cls, name: str) -> Self | None:
        return cls.get_or_none(fn.Lower(cls.name) == name.lower())

    @classmethod
    def by_email(cls, email: str) -> Self | None:
        return cls.get_or_none(cls.email == email)

    @classmethod
    def create_new(cls, name: str, password: str, email: str | None = None) -> "User":
        u = User(name=name)
        u.set_password(password)
        if email:
            u.email = email
        default_options = UserOptions()
        default_options.save()
        u.default_options = default_options
        u.save()

        return u
