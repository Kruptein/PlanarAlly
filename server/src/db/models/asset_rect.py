from typing import cast, TYPE_CHECKING

from peewee import TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiAssetRectShape
from ..typed import SelectSequence
from .base_rect import BaseRect

if TYPE_CHECKING:
    from .asset_rect_variant import AssetRectVariant


class AssetRect(BaseRect):
    variants: SelectSequence["AssetRectVariant"]

    src = cast(str, TextField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiAssetRectShape(**shape.model_dump(), src=self.src, width=self.width, height=self.height)
