import json
from typing import Any, Literal, cast

from peewee import ForeignKeyField, TextField
from typing_extensions import Self, TypedDict

from ...thumbnail import generate_thumbnail_for_asset
from ..base import BaseDbModel
from ..typed import SelectSequence
from .asset_share import AssetShare
from .user import User


class FileStructure(TypedDict):
    __files: list["FileStructureElement"]


class FileStructureElement(TypedDict):
    id: int
    name: str
    hash: str


AssetStructure = FileStructure | dict[str, "AssetStructure"]


class Asset(BaseDbModel):
    id: int
    parent_id: int
    shares: SelectSequence["AssetShare"]

    owner = cast(User, ForeignKeyField(User, backref="assets", on_delete="CASCADE"))
    parent = cast(
        "Asset | None",
        ForeignKeyField("self", backref="children", null=True, on_delete="CASCADE"),
    )
    name = cast(str, TextField())
    file_hash = cast(str | None, TextField(null=True))
    options = cast(str | None, TextField(null=True))

    def __repr__(self):
        return f"<Asset {self.owner.name} - {self.name}>"

    def get_options(self) -> dict[str, Any]:
        return dict(json.loads(self.options or "[]"))

    def set_options(self, options: dict[str, Any]) -> None:
        self.options = json.dumps([[k, v] for k, v in options.items()])

    def get_child(self, name: str) -> "Asset | None":
        asset = Asset.get_or_none(
            (Asset.owner == self.owner) & (Asset.parent == self) & (Asset.name == name)  # type: ignore
        )
        if not asset:
            if share := AssetShare.get_or_none(user=self.owner, name=name, parent=self):
                asset = share.asset
        return asset

    def can_be_accessed_by(self, user: User, *, right: Literal["edit", "view", "all"]) -> bool:
        asset = self
        while asset is not None:
            if asset.owner == user:
                return True
            if any(share.user == user and (share.right == right or right == "all") for share in asset.shares):
                return True
            asset = asset.parent
        return False

    def get_shared_parent(self, user: User) -> AssetShare | None:
        asset = self
        while asset is not None:
            for share in asset.shares:
                if share.user == user:
                    return share
            asset = asset.parent
        return None

    def generate_thumbnails(self) -> None:
        if self.file_hash:
            generate_thumbnail_for_asset(self.name, self.file_hash)

    @classmethod
    def get_root_folder(cls, user) -> Self:
        try:
            root = cls.get(name="/", owner=user, parent=None)
        except Asset.DoesNotExist:
            root = cls.create(name="/", owner=user, parent=None)
        return root

    @classmethod
    def get_user_structure(cls, user, parent=None):
        if parent is None:
            parent = cls.get_root_folder(user)
        # ideally we change this to a single query to get all assets and process them as such
        data: AssetStructure = {"__files": []}
        assets = [*Asset.select().where((Asset.parent == parent))]
        for asset_share in AssetShare().select().where((AssetShare.parent == parent)):
            assets.append(asset_share.asset)
        for asset in assets:
            if asset.file_hash:
                data["__files"].append({"id": asset.id, "name": asset.name, "hash": asset.file_hash})
            else:
                data[asset.name] = cls.get_user_structure(user, asset)
        return data

    @classmethod
    def get_all_assets(cls, user: User, parent=None):
        if parent is None:
            parent = cls.get_root_folder(user)

        assets = [*Asset.select().where((Asset.parent == parent))]
        for asset_share in AssetShare().select().where((AssetShare.parent == parent)):
            assets.append(asset_share.asset)
        for asset in assets:
            yield asset
            yield from cls.get_all_assets(user, asset)
