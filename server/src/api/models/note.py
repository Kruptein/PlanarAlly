from pydantic import BaseModel


class ApiNote(BaseModel):
    uuid: str
    title: str
    text: str
