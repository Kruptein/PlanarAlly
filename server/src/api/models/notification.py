from pydantic import BaseModel


class NotificationShow(BaseModel):
    uuid: str
    message: str
