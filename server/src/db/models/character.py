from typing import cast

from peewee import ForeignKeyField, TextField

from ...api.models.character import ApiCharacter
from ..base import BaseDbModel
from .asset import Asset
from .room import Room
from .user import User


class Character(BaseDbModel):
    id: int

    name = cast(str, TextField())
    owner = cast(User, ForeignKeyField(User, backref="characters", on_delete="CASCADE"))
    asset = cast(
        Asset, ForeignKeyField(Asset, backref="characters", on_delete="RESTRICT")
    )
    campaign = cast(
        Room | None,
        ForeignKeyField(
            Room, backref="characters", on_delete="SET NULL", default=None, null=True
        ),
    )

    def as_pydantic(self):
        from .data_block_character import CharacterDataBlock

        data_blocks_query = CharacterDataBlock.select().where(
            CharacterDataBlock.character == self
        )
        data_blocks = [db.data_block.as_pydantic() for db in data_blocks_query]
        return ApiCharacter(id=self.id, name=self.name, dataBlocks=data_blocks)
