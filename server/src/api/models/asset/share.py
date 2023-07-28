from typing import Literal

from ..helpers import TypeIdModel


class ApiAssetShare(TypeIdModel):
    right: Literal["view"] | Literal["edit"]
    user: str
    asset: int
