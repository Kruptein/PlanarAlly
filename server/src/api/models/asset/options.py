from typing import Literal
from pydantic import BaseModel

from ..helpers import Nullable


class AssetOptionsInfoSuccess(BaseModel):
    name: str
    options: str | Nullable
    success: Literal[True]


class AssetOptionsInfoFail(BaseModel):
    error: str
    success: Literal[False]
