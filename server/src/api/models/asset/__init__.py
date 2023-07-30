from pydantic import Field

from ..helpers import TypeIdModel
from .options import *


class ApiAsset(TypeIdModel):
    id: int = Field(..., typeId="AssetId")
    name: str
    fileHash: str | None
    children: list["ApiAsset"] | None


class ApiAssetFolder(TypeIdModel):
    folder: ApiAsset
    path: list[int] | None = Field(..., typeId="AssetId", noneAsNull=True)


class ApiAssetCreateFolderRequest(TypeIdModel):
    name: str
    parent: int = Field(..., typeId="AssetId")


class ApiAssetCreateFolderResponse(TypeIdModel):
    asset: ApiAsset
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


class ApiAssetUploadFinish(TypeIdModel):
    asset: ApiAsset
    parent: int = Field(..., typeId="AssetId")
