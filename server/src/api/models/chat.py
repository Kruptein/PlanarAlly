from pydantic import BaseModel


class ApiChatMessage(BaseModel):
    id: str
    author: str
    data: list[str]


class ApiChatMessageUpdate(BaseModel):
    id: str
    message: str
