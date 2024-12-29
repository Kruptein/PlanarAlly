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
    id: int = Field(..., typeId="AssetId")
    # The name of the asset can be shown differently depending on sharing state
    name: str
    owner: str
    fileHash: str | None = Field(..., noneAsNull=True)
    # If specified, this provides the list of children for this asset
    # This should only be provided for folders (i.e. assets without a fileHash)
    # And is only provided in specific calls
    children: list["ApiAsset"] | None = Field(..., noneAsNull=True)
    shares: list[ApiAssetShare]  # Info on users that this specific asset is shared with


class ApiAssetFolder(TypeIdModel):
    folder: ApiAsset
    path: list[int] | None = Field(..., typeId="AssetId", noneAsNull=True)
    sharedParent: ApiAsset | None = Field(..., noneAsNull=True)
    sharedRight: Literal["view"] | Literal["edit"] | None = Field(..., noneAsNull=True)


class ApiAssetCreateFolder(TypeIdModel):
    name: str
    parent: int = Field(..., typeId="AssetId")


class ApiAssetInodeMove(TypeIdModel):
    inode: int = Field(..., typeId="AssetId")
    target: int = Field(..., typeId="AssetId")


class ApiAssetRename(TypeIdModel):
    asset: int = Field(..., typeId="AssetId")
    name: str


class ApiAssetUpload(TypeIdModel):
    uuid: str
    name: str
    directory: int = Field(..., typeId="AssetId")
    newDirectories: list[str]
    slice: int
    totalSlices: int
    data: bytes


class ApiAssetAdd(TypeIdModel):
    asset: ApiAsset
    parent: int = Field(..., typeId="AssetId")
