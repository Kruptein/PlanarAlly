from typing import TYPE_CHECKING, Literal, cast

from peewee import DeferredForeignKey, ForeignKeyField, TextField

from ...api.models.asset import ApiAssetShare
from ..base import BaseDbModel
from .user import User

if TYPE_CHECKING:
    from .asset_entry import AssetEntry


class AssetShare(BaseDbModel):
    id: int
    parent_id: int

    entry = cast(
        "AssetEntry",
        DeferredForeignKey(
            "AssetEntry",
            deferrable="INITIALLY DEFERRED",
            backref="shares",
            on_delete="CASCADE",
        ),
    )
    user = cast(User, ForeignKeyField(User, backref="asset_shares", on_delete="CASCADE"))
    right: Literal["view"] | Literal["edit"] = cast(Literal["view"] | Literal["edit"], TextField())
    name = cast(str, TextField())
    parent = cast(
        "AssetEntry",
        DeferredForeignKey(
            "AssetEntry",
            deferrable="INITIALLY DEFERRED",
            backref="share_children",
            on_delete="CASCADE",
        ),
    )

    def as_pydantic(self) -> ApiAssetShare:
        return ApiAssetShare(user=self.user.name, right=self.right)
