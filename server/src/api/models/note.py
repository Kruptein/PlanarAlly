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


class ApiNoteShape(TypeIdModel):
    note_id: str
    shape_id: str = Field(..., typeId="GlobalId")


class ApiNote(TypeIdModel):
    uuid: str
    creator: str
    title: str
    text: str
    tags: list[str]
    isRoomNote: bool
    location: int | None = Field(..., noneAsNull=True)
    access: list[ApiNoteAccess]
    shapes: list[str] = Field(..., typeId="GlobalId")
