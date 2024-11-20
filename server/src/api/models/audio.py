from pydantic import BaseModel


class ApiAudioMessage(BaseModel):
    action: str
    fileName: str