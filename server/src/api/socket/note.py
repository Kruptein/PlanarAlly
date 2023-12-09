import json
from typing import Any

import pydantic

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.db import db
from ...db.models.note import Note
from ...db.models.player_room import PlayerRoom
from ...db.models.shape import Shape
from ...logs import logger
from ...state.game import game_state
from ..helpers import _send_game
from ..models.note import ApiNote, ApiNoteSetText, ApiNoteSetTitle, ApiNoteTag


@sio.on("Note.New", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def new_note(sid: str, raw_data: Any):
    try:
        data = pydantic.parse_obj_as(ApiNote, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.exception(e)
        return

    pr: PlayerRoom = game_state.get(sid)

    if Note.get_or_none(uuid=data.uuid):
        logger.warning(
            f"{pr.player.name} tried to overwrite existing note with id: '{data.uuid}'"
        )
        return

    shape = None
    if data.kind != "campaign" and data.shape is not None:
        shape = Shape.get_or_none(uuid=data.shape)
        if shape is None:
            logger.warning(
                f"{pr.player.name} tried to create a shape note with a non-existent shape: '{data.shape}'"
            )
            return

    location = None
    if data.kind == "location":
        location = pr.active_location

    Note.create(
        uuid=data.uuid,
        kind=data.kind,
        title=data.title,
        text=data.text,
        user=pr.player,
        room=pr.room,
        location=location,
        tags=data.tags,
        shape=shape,
    )


@sio.on("Note.Title.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_title(sid: str, raw_data: Any):
    data = ApiNoteSetTitle(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.title = data.title
        note.save()

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await _send_game("Note.Title.Set", data.dict(), room=psid)


@sio.on("Note.Text.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_text(sid: str, raw_data: Any):
    data = ApiNoteSetText(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.text = data.text
        note.save()

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await _send_game("Note.Text.Set", data.dict(), room=psid)


@sio.on("Note.Tag.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_note_tag(sid: str, raw_data: Any):
    data = ApiNoteTag(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    tags: list[str] = json.loads(note.tags or "[]")
    tags.append(data.tag)

    with db.atomic():
        note.tags = json.dumps(tags)
        note.save()

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await _send_game("Note.Tag.Add", data.dict(), room=psid)


@sio.on("Note.Tag.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_note_tag(sid: str, raw_data: Any):
    data = ApiNoteTag(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    tags: list[str] = json.loads(note.tags or "[]")
    tags.remove(data.tag)

    with db.atomic():
        note.tags = json.dumps(tags)
        note.save()

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await _send_game("Note.Tag.Remove", data.dict(), room=psid)


@sio.on("Note.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_note(sid, uuid):
    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to remove non-existent note with id: '{uuid}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to remove a note not belonging to them.")
        return

    note.delete_instance()

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await _send_game("Note.Remove", uuid, room=psid)
