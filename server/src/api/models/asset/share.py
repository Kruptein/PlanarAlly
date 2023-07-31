from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class ApiAssetCreateShare(TypeIdModel):
    right: Literal["view"] | Literal["edit"]
    user: str
    asset: int = Field(..., typeId="AssetId")


class ApiAssetRemoveShare(TypeIdModel):
    asset: int = Field(..., typeId="AssetId")
    user: str
