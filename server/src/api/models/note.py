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


class ApiNoteAccessRemove(BaseModel):
    uuid: str
    username: str


class ApiNoteAccess(BaseModel):
    name: str
    can_edit: bool
    can_view: bool


class ApiNoteAccessEdit(ApiNoteAccess):
    note: str


class ApiCoreNote(TypeIdModel):
    uuid: str
    owner: str
    title: str
    text: str
    tags: list[str]
    access: list[ApiNoteAccess]


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
