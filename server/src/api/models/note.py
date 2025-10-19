from pydantic import Field

from .helpers import TypeIdModel


class ApiNoteSetString(TypeIdModel):
    uuid: str = Field(typeId="NoteId")
    value: str


class ApiNoteSetBoolean(TypeIdModel):
    uuid: str = Field(typeId="NoteId")
    value: bool


class ApiNoteAccess(TypeIdModel):
    name: str
    can_edit: bool
    can_view: bool


class ApiNoteAccessEdit(ApiNoteAccess):
    note: str = Field(typeId="NoteId")


class ApiNoteShape(TypeIdModel):
    note_id: str = Field(typeId="NoteId")
    shape_id: str = Field(..., typeId="GlobalId")


class ApiNote(TypeIdModel):
    uuid: str = Field(typeId="NoteId")
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
