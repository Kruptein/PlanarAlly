from pydantic import BaseModel


class ApiChatMessage(BaseModel):
    author: str
    data: list[str]
