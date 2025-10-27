from typing import Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class AssetTemplateInfo(TypeIdModel):
    name: str
    id: str = Field(json_schema_extra={"typeId": "GlobalId"})


class AssetOptionsInfoSuccess(TypeIdModel):
    name: str
    templates: list[AssetTemplateInfo]
    success: Literal[True]


class AssetOptionsInfoFail(BaseModel):
    error: str
    success: Literal[False]


class AssetOptionsSet(BaseModel):
    asset: int
    options: str
