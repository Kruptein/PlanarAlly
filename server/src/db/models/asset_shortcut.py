from typing import cast

from peewee import ForeignKeyField

from ..base import BaseDbModel
from .asset_entry import AssetEntry
from .player_room import PlayerRoom


class AssetShortcut(BaseDbModel):
    id: int

    entry = cast(
        "AssetEntry",
        ForeignKeyField(
            AssetEntry,
            backref="shortcuts",
            on_delete="CASCADE",
        ),
    )
    player_room = cast(
        "PlayerRoom",
        ForeignKeyField(PlayerRoom, backref="asset_shortcuts", on_delete="CASCADE"),
    )
