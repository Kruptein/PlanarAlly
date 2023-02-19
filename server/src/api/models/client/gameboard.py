from pydantic import Field

from ..helpers import TypeIdModel


class ClientGameboardSet(TypeIdModel):
    client: str = Field(typeId="ClientId")
    boardId: str
