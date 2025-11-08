import json
from typing import TYPE_CHECKING, cast

from peewee import JOIN, ForeignKeyField, TextField

from ...api.models.note import ApiNote
from ..base import BaseDbModel
from ..typed import SelectSequence
from .note_access import NoteAccess
from .note_room import NoteRoom
from .note_shape import NoteShape
from .shape_room_view import ShapeRoomView
from .user import User

if TYPE_CHECKING:
    from .player_room import PlayerRoom


class Note(BaseDbModel):
    access: SelectSequence["NoteAccess"]
    rooms: SelectSequence["NoteRoom"]
    shapes: SelectSequence["NoteShape"]

    uuid = cast(str, TextField(primary_key=True))
    creator = ForeignKeyField(User, backref="notes", on_delete="CASCADE")
    title = cast(str, TextField())
    text = cast(str, TextField())
    tags = cast(str | None, TextField(null=True))

    show_on_hover = cast(bool, TextField(default="false"))
    show_icon_on_shape = cast(bool, TextField(default="false"))

    def __repr__(self):
        return f"<Note {self.title} - {self.creator.name}"

    def as_pydantic(self):
        tags = json.loads(self.tags) if self.tags else []
        access = [a.as_pydantic() for a in self.access]
        rooms = [r.as_pydantic() for r in self.rooms]
        return ApiNote(
            uuid=self.uuid,
            creator=self.creator.name,
            title=self.title,
            text=self.text,
            tags=tags,
            showOnHover=self.show_on_hover,
            showIconOnShape=self.show_icon_on_shape,
            access=access,
            rooms=rooms,
            shapes=[s.shape.uuid for s in self.shapes],
        )

    @classmethod
    def __access_query_filter(cls, pr: "PlayerRoom"):
        return (
            # Global
            (
                (NoteRoom.id >> None)  # type: ignore
                & (
                    # Note owner or specific access (w/o default access)
                    (Note.creator == pr.player) | ((NoteAccess.user == pr.player) & NoteAccess.can_view)
                )
            )
            | (
                # Local
                ((NoteRoom.room == pr.room) | (ShapeRoomView.room_id == pr.room.id))  # type: ignore
                & (
                    # Note owner or specific access
                    (Note.creator == pr.player)
                    | (
                        ((NoteAccess.user >> None) | (NoteAccess.user == pr.player))  # type: ignore
                        & NoteAccess.can_view
                    )
                )
            )
        )

    @classmethod
    def get_for_shape(cls, shape_id: str, pr: "PlayerRoom") -> list[ApiNote]:
        notes = (
            cls.select()
            .join(NoteShape, JOIN.INNER)
            .join(NoteRoom, JOIN.LEFT_OUTER, on=(Note.uuid == NoteRoom.note_id))
            .join(NoteAccess, JOIN.LEFT_OUTER, on=(Note.uuid == NoteAccess.note_id))
            .join(ShapeRoomView, JOIN.LEFT_OUTER, on=(NoteShape.shape_id == ShapeRoomView.shape_id))
            .where((NoteShape.shape_id == shape_id) & cls.__access_query_filter(pr))
            .group_by(Note.uuid)
        )

        return [note.as_pydantic() for note in notes]

    @classmethod
    def get_for_player(cls, pr: "PlayerRoom") -> list[ApiNote]:
        notes = (
            cls.select()
            .join(NoteShape, JOIN.LEFT_OUTER)
            .join(NoteRoom, JOIN.LEFT_OUTER, on=(Note.uuid == NoteRoom.note_id))
            .join(NoteAccess, JOIN.LEFT_OUTER, on=(Note.uuid == NoteAccess.note_id))
            .join(ShapeRoomView, JOIN.LEFT_OUTER, on=(NoteShape.shape_id == ShapeRoomView.shape_id))
            .where(cls.__access_query_filter(pr))
            .group_by(Note.uuid)
        )

        return [note.as_pydantic() for note in notes]
