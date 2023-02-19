from pydantic import BaseModel


class FloorBackgroundSet(BaseModel):
    name: str
    background: str | None
