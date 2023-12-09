from typing import Annotated, Literal

from pydantic import BaseModel, Field

from .helpers import TypeIdModel


class ApiNoteSetTitle(BaseModel):
    uuid: str
    title: str


class ApiNoteSetText(BaseModel):
    uuid: str
    text: str


class ApiNoteTag(BaseModel):
    uuid: str
    tag: str


class ApiCoreNote(TypeIdModel):
    uuid: str
    title: str
    text: str
    tags: list[str]
    access: Literal["private", "public", "mixed"]


class ApiCampaignNote(ApiCoreNote):
    kind: Literal["campaign"]


class ApiLocationNote(ApiCoreNote):
    kind: Literal["location"]
    location: int
    shape: str | None = Field(typeId="GlobalId")


# RoomDataBlock is always associated with the active user
class ApiShapeNote(ApiCoreNote):
    kind: Literal["shape"]
    shape: str = Field(typeId="GlobalId")


ApiNote = Annotated[
    ApiCampaignNote | ApiLocationNote | ApiShapeNote,
    Field(discriminator="kind"),
]
