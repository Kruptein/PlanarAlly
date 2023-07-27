from typing import cast

from peewee import ForeignKeyField

from .data_block import DataBlock
from .room import Room


class RoomDataBlock(DataBlock):
    room = cast(Room, ForeignKeyField(Room, backref="data_blocks", on_delete="CASCADE"))

    def as_pydantic(self):
        from ...api.models.data_block import ApiRoomDataBlock

        return ApiRoomDataBlock(
            source=self.source,
            name=self.name,
            category="room",
            data=self.data,
        )
