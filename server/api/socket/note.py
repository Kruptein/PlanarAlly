from typing import Any, Dict

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import Note, PlayerRoom
from models.db import db
from state.game import game_state


@sio.on("Note.New", namespace=GAME_NS)
@auth.login_required(app, sio)
async def new_note(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if Note.get_or_none(uuid=data["uuid"]):
        logger.warning(
            f"{pr.player.name} tried to overwrite existing note with id: '{data['uuid']}'"
        )
        return

    Note.create(
        uuid=data["uuid"],
        title=data["title"],
        text=data["text"],
        user=pr.player,
        room=pr.room,
        location=pr.active_location,
    )


@sio.on("Note.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_note(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data["uuid"])

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existant note with id: '{data['uuid']}'"
        )
        return

    if note.user != pr.player:
        logger.warn(f"{pr.player.name} tried to update note not belonging to him/her.")
    else:
        with db.atomic():
            note.title = data["title"]
            note.text = data["text"]
            note.save()


@sio.on("Note.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def delete_note(sid, uuid):
    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to remove non-existant note with id: '{uuid}'"
        )
        return

    note.delete_instance()
