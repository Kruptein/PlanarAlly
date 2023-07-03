from typing import cast

from peewee import TextField

from ...api.models.data_block import ApiDataBlock
from ..base import BaseDbModel


class DataBlock(BaseDbModel):
    source = cast(str, TextField())
    name = cast(str, TextField())
    data = cast(str, TextField())

    def as_pydantic(self):
        return ApiDataBlock(source=self.source, name=self.name, data=self.data)
