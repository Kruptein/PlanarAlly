from typing import TYPE_CHECKING, Literal, cast

from peewee import IntegerField, TextField


from ...logs import logger
from ...thumbnail import generate_thumbnail_for_asset
from ...utils import ASSETS_DIR, get_asset_hash_subpath
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

    def __repr__(self):
        return f"<Asset {self.file_hash}>"

    def cleanup_check(self):
        full_hash_path = get_asset_hash_subpath(self.file_hash)
        if (ASSETS_DIR / full_hash_path).exists():
            if self.entries.count() == 0 and self.asset_rects.count() == 0 and self.templates.count() == 0:
                logger.info(f"No data maps to file {self.file_hash}, removing from server")
                (ASSETS_DIR / full_hash_path).unlink()
                for suffix in [".thumb.webp", ".thumb.jpeg"]:
                    (ASSETS_DIR / f"{full_hash_path}{suffix}").unlink(missing_ok=True)

    def generate_thumbnails(self) -> None:
        generate_thumbnail_for_asset(self.file_hash)

    def has_entry_with_access(self, user: User, right: Literal["edit", "view", "all"]) -> bool:
        return any(entry.can_be_accessed_by(user, right=right) for entry in self.entries)

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("file_hash",), True),)
