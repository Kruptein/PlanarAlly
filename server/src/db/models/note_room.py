from typing import TYPE_CHECKING, cast

from peewee import DeferredForeignKey

from ...api.models.note import ApiNoteRoom

from ..base import BaseDbModel

if TYPE_CHECKING:
    from .location import Location
    from .note import Note
    from .room import Room


class NoteRoom(BaseDbModel):
    note_id: str
    room_id: str

    note = cast(
        "Note", DeferredForeignKey("Note", deferrable="INITIALLY DEFERRED", backref="rooms", on_delete="CASCADE")
    )
    room = cast(
        "Room",
        DeferredForeignKey("Room", deferrable="INITIALLY DEFERRED", backref="notes", on_delete="CASCADE"),
    )
    location = cast(
        "Location | None",
        DeferredForeignKey(
            "Location", null=True, deferrable="INITIALLY DEFERRED", backref="notes", on_delete="CASCADE"
        ),
    )

    def as_pydantic(self):
        return ApiNoteRoom(
            roomCreator=self.room.creator.name,
            roomName=self.room.name,
            locationId=self.location.id if self.location else None,
            locationName=self.location.name if self.location else None,
        )

    class Meta:  # pyright: ignore [reportIncompatibleVariableOverride]
        indexes = ((("note_id", "room_id", "location_id"), True),)
