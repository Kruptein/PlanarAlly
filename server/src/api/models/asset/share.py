from typing import Literal

from pydantic import Field

from ..helpers import TypeIdModel


class ApiAssetCreateShare(TypeIdModel):
    right: Literal["view"] | Literal["edit"]
    user: str
    asset: int = Field(json_schema_extra={"typeId": "AssetEntryId"})


class ApiAssetRemoveShare(TypeIdModel):
    asset: int = Field(json_schema_extra={"typeId": "AssetEntryId"})
    user: str
