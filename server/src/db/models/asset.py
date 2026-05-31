from typing import TYPE_CHECKING, Literal, cast

from peewee import BlobField, IntegerField, TextField

from ...api.models.asset import ApiAssetCore
from ...logs import logger
from ...storage import get_storage
from ...thumbnail import generate_thumbnail_for_asset
from ..base import BaseDbModel
from ..typed import SelectSequence
from .user import User

if TYPE_CHECKING:
    from .asset_entry import AssetEntry
    from .asset_rect import AssetRect
    from .shape_template import ShapeTemplate


class Asset(BaseDbModel):
    id: int

    # !! When links are added update the cleanup function !!
    entries: SelectSequence["AssetEntry"]
    asset_rects: SelectSequence["AssetRect"]
    templates: SelectSequence["ShapeTemplate"]

    file_hash = cast(str, TextField())
    kind = cast(Literal["regular", "ddraft"], TextField())
    extension = cast(str | None, TextField(null=True))
    file_size = cast(int | None, IntegerField(null=True))

    # Depending on the asset type, additional data might be stored on the DB level.
    # For regular files, this is empty
    # For ddraft files, a JSON object keyed by user id is stored, with an array of ddraft templates as the value
    kind_specific_data = cast(bytes | None, BlobField(null=True))

    def __repr__(self):
        return f"<Asset {self.file_hash}>"

    async def cleanup_check(self):
        storage = get_storage()
        if self.entries.count() == 0 and self.asset_rects.count() == 0 and self.templates.count() == 0:
            if await storage.exists(self.file_hash):
                logger.info(f"No data maps to file {self.file_hash}, removing from server")
                await storage.delete(self.file_hash)
                await storage.delete(self.file_hash, suffix=".thumb.webp")
                await storage.delete(self.file_hash, suffix=".thumb.jpeg")

    async def generate_thumbnails(self) -> None:
        await generate_thumbnail_for_asset(self.file_hash)

    def has_entry_with_access(self, user: User, right: Literal["edit", "view", "all"]) -> bool:
        return any(entry.can_be_accessed_by(user, right=right) for entry in self.entries)

    def as_pydantic(self) -> ApiAssetCore:
        return ApiAssetCore(
            id=self.id,
            fileHash=self.file_hash,
            kind=self.kind,
            hasTemplates=self.templates.count() > 0,
            hasExtraData=self.kind_specific_data is not None,
        )

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("file_hash",), True),)
