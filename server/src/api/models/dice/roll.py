from pydantic import BaseModel


class DiceRollResult(BaseModel):
    player: str
    roll: str
    result: str
    shareWithAll: bool
