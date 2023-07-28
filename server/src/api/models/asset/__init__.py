from pydantic import Field

from ..helpers import TypeIdModel
from .options import *


class ApiAsset(TypeIdModel):
    id: int = Field(..., typeId="AssetId")
    name: str
    fileHash: str | None
    children: list["ApiAsset"] | None
