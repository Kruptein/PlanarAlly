from typing import Literal

from pydantic import BaseModel


class DiceRollResult(BaseModel):
    player: str
    roll: str
    input: str | None = None
    shareWith: Literal["all", "dm", "none"]
