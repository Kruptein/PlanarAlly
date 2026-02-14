from peewee import ForeignKeyField, TextField
from typing import cast

from ..base import BaseDbModel
from .asset import Asset
from .asset_rect import AssetRect


class AssetRectVariant(BaseDbModel):
    shape = cast(AssetRect, ForeignKeyField(AssetRect, backref="variants", on_delete="CASCADE"))
    name = cast(str, TextField())
    asset = cast(Asset, ForeignKeyField(Asset, backref="asset_rect_variants", on_delete="RESTRICT"))

    # def as_pydantic(self, shape: ApiCoreShape):
    #     return ApiAssetRectShape(**shape.model_dump(), src=self.src, width=self.width, height=self.height)
