from typing import Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class AssetTemplatesInfoRequest(TypeIdModel):
    assetId: int = Field(json_schema_extra={"typeId": "AssetId"})
    entryId: int = Field(
        json_schema_extra={"typeId": "AssetEntryId"},
    )


class AssetTemplateInfo(TypeIdModel):
    name: str
    id: str = Field(json_schema_extra={"typeId": "GlobalId"})


class AssetTemplatesInfoSuccess(TypeIdModel):
    name: str
    templates: list[AssetTemplateInfo]
    success: Literal[True]


class AssetTemplatesInfoFail(BaseModel):
    error: str
    success: Literal[False]
