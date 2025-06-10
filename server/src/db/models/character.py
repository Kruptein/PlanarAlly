from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField, TextField

from ...api.models.character import ApiCharacter
from ..base import BaseDbModel
from ..typed import SelectSequence
from .asset import Asset
from .room import Room
from .user import User

if TYPE_CHECKING:
    from .shape import Shape


class Character(BaseDbModel):
    id: int
    shapes: SelectSequence["Shape"]

    name = cast(str, TextField())
    owner = cast(User, ForeignKeyField(User, backref="characters", on_delete="CASCADE"))
    asset = cast(Asset, ForeignKeyField(Asset, backref="characters", on_delete="RESTRICT"))
    campaign = cast(
        Room | None,
        ForeignKeyField(Room, backref="characters", on_delete="SET NULL", default=None, null=True),
    )

    @property
    def shape(self):
        return self.shapes[0]

    def as_pydantic(self):
        file_hash = self.asset.file_hash
        if file_hash is None:
            raise Exception("Character with illegal Asset link detected")
        return ApiCharacter(
            id=self.id,
            name=self.name,
            shapeId=self.shape.uuid,
            assetHash=file_hash,
            assetId=self.asset.id,
        )
