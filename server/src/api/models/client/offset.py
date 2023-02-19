from pydantic import Field

from ..helpers import TypeIdModel


class ClientOffsetSet(TypeIdModel):
    client: str = Field(typeId="ClientId")
    x: int | None
    y: int | None
