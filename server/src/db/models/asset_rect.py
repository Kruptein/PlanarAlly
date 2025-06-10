from typing import cast

from peewee import TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiAssetRectShape
from .base_rect import BaseRect


class AssetRect(BaseRect):
    src = cast(str, TextField())

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiAssetRectShape(**shape.dict(), src=self.src, width=self.width, height=self.height)
