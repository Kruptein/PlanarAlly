from pydantic import BaseModel


class InitiativeValueSet(BaseModel):
    shape: str
    value: int
