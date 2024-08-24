from typing import Literal

from pydantic import BaseModel


class DiceRollResult(BaseModel):
    player: str
    roll: str
    shareWith: Literal["all", "dm", "none"]
