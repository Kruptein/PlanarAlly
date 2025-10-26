from pydantic import Field

from .helpers import TypeIdModel


class ApiNoteSetString(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "NoteId"})
    value: str


class ApiNoteSetBoolean(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "NoteId"})
    value: bool


class ApiNoteAccess(TypeIdModel):
    name: str
    can_edit: bool
    can_view: bool


class ApiNoteAccessEdit(ApiNoteAccess):
    note: str = Field(json_schema_extra={"typeId": "NoteId"})


class ApiNoteShape(TypeIdModel):
    note_id: str = Field(json_schema_extra={"typeId": "NoteId"})
    shape_id: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ApiNote(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "NoteId"})
    creator: str
    title: str
    text: str
    tags: list[str]
    showOnHover: bool
    showIconOnShape: bool
    isRoomNote: bool
    location: int | None
    access: list[ApiNoteAccess]
    shapes: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})
