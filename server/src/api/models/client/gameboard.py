from pydantic import BaseModel


class ClientGameboardSet(BaseModel):
    client: str
    boardId: str
