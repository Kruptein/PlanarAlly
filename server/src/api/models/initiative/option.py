from typing import Literal

from pydantic import BaseModel


class InitiativeOptionSet(BaseModel):
    shape: str
    option: Literal["isVisible"] | Literal["isGroup"]
    value: bool
    value: bool
