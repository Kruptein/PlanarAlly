from __future__ import annotations

from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel
from .options import *
from .share import *


class ApiAssetShare(TypeIdModel):
    user: str
    right: Literal["view"] | Literal["edit"]


class ApiAsset(TypeIdModel):
    id: int = Field(json_schema_extra={"typeId": "AssetId"})
    # The name of the asset can be shown differently depending on sharing state
    name: str
    owner: str
    fileHash: str | None
    # If specified, this provides the list of children for this asset
    # This should only be provided for folders (i.e. assets without a fileHash)
    # And is only provided in specific calls
    children: list["ApiAsset"] | None
    shares: list[ApiAssetShare]  # Info on users that this specific asset is shared with
    has_templates: bool


class ApiAssetFolder(TypeIdModel):
    folder: ApiAsset
    path: list[int] | None = Field(json_schema_extra={"typeId": "AssetId"})
    sharedParent: ApiAsset | None
    sharedRight: Literal["view"] | Literal["edit"] | None


class ApiAssetCreateFolder(TypeIdModel):
    name: str
    parent: int = Field(json_schema_extra={"typeId": "AssetId"})


class ApiAssetInodeMove(TypeIdModel):
    inode: int = Field(json_schema_extra={"typeId": "AssetId"})
    target: int = Field(json_schema_extra={"typeId": "AssetId"})


class ApiAssetRename(TypeIdModel):
    asset: int = Field(json_schema_extra={"typeId": "AssetId"})
    name: str


class ApiAssetUpload(TypeIdModel):
    uuid: str
    name: str
    directory: int = Field(json_schema_extra={"typeId": "AssetId"})
    newDirectories: list[str]
    slice: int
    totalSlices: int
    data: bytes


class ApiAssetAdd(TypeIdModel):
    asset: ApiAsset
    parent: int = Field(json_schema_extra={"typeId": "AssetId"})
