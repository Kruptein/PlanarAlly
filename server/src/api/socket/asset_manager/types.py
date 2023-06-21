from typing import Optional, TypedDict


class AssetDict(TypedDict):
    id: int
    name: str
    file_hash: Optional[str]
    options: Optional[str]
    parent: int
    children: Optional[list["AssetDict"]]


class AssetExport(TypedDict):
    file_hashes: list[str]
    data: list[AssetDict]
