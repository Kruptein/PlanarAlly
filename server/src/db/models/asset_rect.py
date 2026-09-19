from typing import Any, cast
from typing import TYPE_CHECKING

from peewee import ForeignKeyField
from playhouse.shortcuts import model_to_dict

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiAssetRectShape
from ..typed import SelectSequence
from .asset import Asset
from .base_rect import BaseRect
from .shape import Shape

if TYPE_CHECKING:
    from .asset_rect_variant import AssetRectVariant


class AssetRect(BaseRect):
    id: int
    asset_id: int
    variants: SelectSequence["AssetRectVariant"]

    asset = cast(Asset, ForeignKeyField(Asset, backref="asset_rects", on_delete="CASCADE"))

    @staticmethod
    def pre_create(data_dict: dict[Any, Any], reduced_dict: dict[Any, Any]) -> dict[Any, Any]:
        return {**reduced_dict, "asset_id": data_dict["assetId"]}

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiAssetRectShape(
            **shape.model_dump(),
            assetHash=self.asset.file_hash,
            assetId=self.asset_id,
            width=self.width,
            height=self.height,
        )

    def make_copy(self, new_shape: Shape):
        _dict = model_to_dict(self, exclude=[AssetRect.shape, AssetRect.asset])
        _dict["asset_id"] = self.asset_id
        AssetRect.create(shape=new_shape, **_dict)
