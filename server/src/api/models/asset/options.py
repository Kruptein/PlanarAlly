from typing import Literal

from pydantic import BaseModel

from ..helpers import TypeIdModel


class AssetOptionsInfoSuccess(TypeIdModel):
    name: str
    options: str | None
    success: Literal[True]


class AssetOptionsInfoFail(BaseModel):
    error: str
    success: Literal[False]


class AssetOptionsSet(BaseModel):
    asset: int
    options: str
