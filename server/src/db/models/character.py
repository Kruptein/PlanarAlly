from typing import TYPE_CHECKING, cast

from peewee import ForeignKeyField

from ...api.models.character import ApiCharacter
from ..base import BaseDbModel
from .room import Room
from .shape import Shape

if TYPE_CHECKING:
    from .asset_rect import AssetRect


class Character(BaseDbModel):
    id: int

    shape = cast(Shape, ForeignKeyField(Shape, backref="characters", unique=True, on_delete="CASCADE"))
    campaign = cast(
        Room | None,
        ForeignKeyField(Room, backref="characters", on_delete="SET NULL", default=None, null=True),
    )

    def as_pydantic(self):
        shape = self.shape
        asset_rect = cast("AssetRect", shape.subtype)
        file_hash = asset_rect.asset.file_hash
        if file_hash is None:
            raise Exception("Character with illegal Asset link detected")  # noqa: TRY002
        return ApiCharacter(
            id=self.id,
            name=shape.name or "Unknown Shape",
            shapeId=shape.uuid,
            assetHash=file_hash,
            assetId=asset_rect.asset_id,
        )
