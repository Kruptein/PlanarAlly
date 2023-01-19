from pydantic import BaseModel


class ClientOffsetSet(BaseModel):
    client: str
    x: int | None
    y: int | None
