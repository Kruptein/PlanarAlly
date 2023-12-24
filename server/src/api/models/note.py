from pydantic import BaseModel, Field

from .helpers import TypeIdModel


class ApiNoteSetString(BaseModel):
    uuid: str
    value: str


class ApiNoteSetBoolean(BaseModel):
    uuid: str
    value: bool


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
    showOnHover: bool
    showIconOnShape: bool
    isRoomNote: bool
    location: int | None = Field(..., noneAsNull=True)
    access: list[ApiNoteAccess]
    shapes: list[str] = Field(..., typeId="GlobalId")
