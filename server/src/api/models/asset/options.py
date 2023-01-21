from typing import Literal

from pydantic import BaseModel, Field

from ..helpers import TypeIdModel


class AssetOptionsInfoSuccess(TypeIdModel):
    name: str
    options: str | None = Field(..., noneAsNull=True)
    success: Literal[True]


class AssetOptionsInfoFail(BaseModel):
    error: str
    success: Literal[False]


class AssetOptionsSet(BaseModel):
    asset: int
    options: str
