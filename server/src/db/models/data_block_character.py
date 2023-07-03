from typing import cast

from peewee import ForeignKeyField

from ..base import BaseDbModel
from .character import Character
from .data_block import DataBlock


class CharacterDataBlock(BaseDbModel):
    character = cast(
        Character, ForeignKeyField(Character, backref="characters", on_delete="CASCADE")
    )
    data_block = cast(
        DataBlock,
        ForeignKeyField(DataBlock, backref="characters", on_delete="CASCADE"),
    )
