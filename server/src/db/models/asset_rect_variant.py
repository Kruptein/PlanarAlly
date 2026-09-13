from peewee import FloatField, ForeignKeyField, TextField
from typing import cast

from ...api.models.shape.variants import ApiVariant
from ..base import BaseDbModel
from .asset import Asset
from .asset_rect import AssetRect


class AssetRectVariant(BaseDbModel):
    id: int
    asset_id: int

    shape = cast(AssetRect, ForeignKeyField(AssetRect, backref="variants", on_delete="CASCADE"))
    name = cast(str | None, TextField(null=True))
    asset = cast(Asset, ForeignKeyField(Asset, backref="asset_rect_variants", on_delete="RESTRICT"))
    width = cast(float, FloatField())
    height = cast(float, FloatField())

    def as_pydantic(self):
        return ApiVariant(
            id=self.id,
            name=self.name,
            assetId=self.asset.id,
            assetHash=self.asset.file_hash,
            width=self.width,
            height=self.height,
        )
