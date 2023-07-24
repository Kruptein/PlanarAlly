from typing import cast

from peewee import ForeignKeyField

from .data_block import DataBlock
from .user import User


class UserDataBlock(DataBlock):
    user = cast(User, ForeignKeyField(User, backref="data_blocks", on_delete="CASCADE"))

    def as_pydantic(self):
        from ...api.models.data_block import ApiUserDataBlock

        return ApiUserDataBlock(
            source=self.source,
            name=self.name,
            category="user",
            data=self.data,
        )
