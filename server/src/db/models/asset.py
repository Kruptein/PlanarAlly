from typing import TYPE_CHECKING, Literal, cast

from peewee import TextField


from ...logs import logger
from ...thumbnail import generate_thumbnail_for_asset
from ...utils import ASSETS_DIR, get_asset_hash_subpath
from ..base import BaseDbModel
from ..typed import SelectSequence
from .user import User

if TYPE_CHECKING:
    from .asset_entry import AssetEntry
    from .shape import Shape
    from .shape_template import ShapeTemplate


class Asset(BaseDbModel):
    id: int

    # !! When links are added update the cleanup function !!
    entries: SelectSequence["AssetEntry"]
    shapes: SelectSequence["Shape"]
    templates: SelectSequence["ShapeTemplate"]

    file_hash = cast(str, TextField())

    def __repr__(self):
        return f"<Asset {self.file_hash}>"

    def cleanup_check(self):
        full_hash_path = get_asset_hash_subpath(self.file_hash)
        if (ASSETS_DIR / full_hash_path).exists():
            if self.entries.count() == 0 and self.shapes.count() == 0 and self.templates.count() == 0:
                logger.info(f"No data maps to file {self.file_hash}, removing from server")
                (ASSETS_DIR / full_hash_path).unlink()

    def generate_thumbnails(self) -> None:
        generate_thumbnail_for_asset(self.file_hash)

    def has_entry_with_access(self, user: User, right: Literal["edit", "view", "all"]) -> bool:
        return any(entry.can_be_accessed_by(user, right=right) for entry in self.entries)

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("file_hash",), True),)
