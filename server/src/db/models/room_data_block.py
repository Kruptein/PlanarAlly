from typing import cast

from peewee import ForeignKeyField, TextField

from .data_block import DataBlock
from .room import Room


class RoomDataBlock(DataBlock):
    room = cast(Room, ForeignKeyField(Room, backref="data_blocks", on_delete="CASCADE"))
    read_access = cast(str, TextField(default="room"))
    write_access = cast(str, TextField(default="room"))

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("source", "name", "room"), True),)

    def as_pydantic(self):
        from ...api.models.data_block import ApiRoomDataBlock

        return ApiRoomDataBlock(
            source=self.source,
            name=self.name,
            category="room",
            data=self.data,
        )
