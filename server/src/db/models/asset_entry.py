from typing import Literal, cast

from peewee import ForeignKeyField, TextField
from typing_extensions import Self, TypedDict

from ..base import BaseDbModel
from ..typed import SelectSequence
from .asset import Asset
from .asset_share import AssetShare
from .user import User


class FileStructure(TypedDict):
    __files: list["FileStructureElement"]


class FileStructureElement(TypedDict):
    id: int
    name: str
    hash: str


AssetStructure = FileStructure | dict[str, "AssetStructure"]


class AssetEntry(BaseDbModel):
    id: int
    parent_id: int
    shares: SelectSequence["AssetShare"]

    owner = cast(User, ForeignKeyField(User, backref="asset_entries", on_delete="CASCADE"))
    parent = cast(
        "AssetEntry | None",
        ForeignKeyField("self", backref="children", null=True, on_delete="CASCADE"),
    )
    asset = cast(Asset | None, ForeignKeyField(Asset, backref="entries", on_delete="CASCADE", null=True))
    name = cast(str, TextField())

    def __repr__(self):
        return f"<AssetEntry {self.owner.name} - {self.name}>"

    def get_child(self, name: str) -> "AssetEntry | None":
        asset = AssetEntry.get_or_none(
            (AssetEntry.owner == self.owner) & (AssetEntry.parent == self) & (AssetEntry.name == name)  # type: ignore
        )
        if not asset:
            if share := AssetShare.get_or_none(user=self.owner, name=name, parent=self):
                asset = share.entry
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

    @classmethod
    def get_root_folder(cls, user) -> Self:
        try:
            root = cls.get(name="/", owner=user, parent=None)
        except AssetEntry.DoesNotExist:
            root = cls.create(name="/", owner=user, parent=None)
        return root

    @classmethod
    def get_user_structure(cls, user, parent=None):
        if parent is None:
            parent = cls.get_root_folder(user)
        # ideally we change this to a single query to get all assets and process them as such
        data: AssetStructure = {"__files": []}
        entries = [*AssetEntry.select().where((AssetEntry.parent == parent))]
        for asset_share in AssetShare().select().where((AssetShare.parent == parent)):
            entries.append(asset_share.entry)
        for entry in entries:
            if entry.asset:
                data["__files"].append({"id": entry.id, "name": entry.name, "hash": entry.asset.file_hash})
            else:
                data[entry.name] = cls.get_user_structure(user, entry)
        return data

    @classmethod
    def get_all_assets(cls, user: User, parent=None):
        if parent is None:
            parent = cls.get_root_folder(user)

        entries = [*AssetEntry.select().where((AssetEntry.parent == parent))]
        for asset_share in AssetShare().select().where((AssetShare.parent == parent)):
            entries.append(asset_share.entry)
        for entry in entries:
            yield entry
            yield from cls.get_all_assets(user, entry)
