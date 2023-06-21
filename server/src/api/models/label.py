from pydantic import BaseModel


class ApiLabel(BaseModel):
    uuid: str
    user: str
    category: str
    name: str
    visible: bool


class LabelVisibilitySet(BaseModel):
    uuid: str
    visible: bool
