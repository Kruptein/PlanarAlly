from typing import cast

from peewee import TextField

from ..base import BaseDbModel

# This class is provided as an absctract superclass for specific DB implementations
# It should never be instantiated directly


class DataBlock(BaseDbModel):
    source = cast(str, TextField())
    name = cast(str, TextField())
    data = cast(str, TextField())

    def as_pydantic(self):
        raise Exception(
            "This DataBlock was instantiated using the astract super class instead of a specialized version."
        )
