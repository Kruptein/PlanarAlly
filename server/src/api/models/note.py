import enum
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


class ApiNoteRoom(TypeIdModel):
    roomCreator: str
    roomName: str
    locationId: int | None
    locationName: str | None


class ApiNoteRoomLink(ApiNoteRoom):
    note: str = Field(json_schema_extra={"typeId": "NoteId"})


class ApiNote(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "NoteId"})
    creator: str
    title: str
    text: str
    tags: list[str]
    showOnHover: bool
    showIconOnShape: bool
    rooms: list[ApiNoteRoom]
    access: list[ApiNoteAccess]
    shapes: list[str] = Field(json_schema_extra={"typeId": "GlobalId"})


class DefaultNoteFilter(enum.StrEnum):
    NO_FILTER = "NO_FILTER"
    ACTIVE_FILTER = "ACTIVE_FILTER"  # Used for both "Active location" and "has shapes" style filters
    NO_LINK_FILTER = "NO_LINK_FILTER"  # Used for both "No linked campaign" and "No linked shapes" style filters


class ApiNoteSearch(TypeIdModel):
    search: str
    campaign_filter: DefaultNoteFilter
    location_filter: list[DefaultNoteFilter | int]
    shape_filter: list[DefaultNoteFilter | str]
    tag_filter: list[DefaultNoteFilter | str]
    search_title: bool
    search_text: bool
    search_author: bool
    page_number: int
    page_size: int
