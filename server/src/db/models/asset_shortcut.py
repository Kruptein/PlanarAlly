from typing import cast

from peewee import ForeignKeyField

from ..base import BaseDbModel
from .asset import Asset
from .player_room import PlayerRoom


class AssetShortcut(BaseDbModel):
    id: int

    asset = cast(
        "Asset",
        ForeignKeyField(
            Asset,
            backref="shortcuts",
            on_delete="CASCADE",
        ),
    )
    player_room = cast(
        "PlayerRoom",
        ForeignKeyField(PlayerRoom, backref="asset_shortcuts", on_delete="CASCADE"),
    )
