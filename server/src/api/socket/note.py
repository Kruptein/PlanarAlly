import json
from typing import Any

import pydantic

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.db import db
from ...db.models.note import Note
from ...db.models.note_access import NoteAccess
from ...db.models.note_shape import NoteShape
from ...db.models.player_room import PlayerRoom
from ...db.models.user import User
from ...logs import logger
from ...state.game import game_state
from ..helpers import _send_game
from ..models.note import (
    ApiNote,
    ApiNoteAccessEdit,
    ApiNoteSetBoolean,
    ApiNoteSetString,
    ApiNoteShape,
)


def can_edit(note: Note, user: User):
    return note.creator == user or any(
        (not a.user or a.user == user) and a.can_edit for a in note.access
    )


def can_view(note: Note, user: User):
    return note.creator == user or any(
        (not a.user or a.user == user) and a.can_view for a in note.access
    )


async def send_create_note(note: Note, psid: str):
    await _send_game("Note.Add", note.as_pydantic(), room=psid)


async def send_remove_note(uuid: str, psid: str):
    await _send_game("Note.Remove", uuid, room=psid)


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

    note = Note.create(
        uuid=data.uuid,
        creator=pr.player,
        title=data.title,
        text=data.text,
        tags=data.tags,
        show_on_hover=data.showOnHover,
        show_icon_on_shape=data.showIconOnShape,
        room=pr.room if data.isRoomNote else None,
        location=data.location,
    )

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await send_create_note(note, psid)


@sio.on("Note.Title.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_title(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.title = data.value
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Title.Set", data.dict(), room=psid)


@sio.on("Note.Text.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_text(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.text = data.value
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Text.Set", data.dict(), room=psid)


@sio.on("Note.Tag.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_note_tag(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    tags: list[str] = json.loads(note.tags or "[]")
    tags.append(data.value)

    with db.atomic():
        note.tags = json.dumps(tags)
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Tag.Add", data.dict(), room=psid)


@sio.on("Note.Tag.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_note_tag(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    tags: list[str] = json.loads(note.tags or "[]")
    tags.remove(data.value)

    with db.atomic():
        note.tags = json.dumps(tags)
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
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

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to remove a note not belonging to them.")
        return

    note.delete_instance()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await send_remove_note(uuid, psid)


@sio.on("Note.Access.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_note_access(sid, raw_data: Any):
    data = ApiNoteAccessEdit(**raw_data)
    uuid = data.note

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update a note not belonging to them.")
        return

    user = None
    if data.name != "default":
        user = User.by_name(data.name)
    elif note.room is None:
        logger.warning(f"Note '{uuid}' is global but tried to add default access")
        return

    NoteAccess.create(
        note=note, user=user, can_edit=data.can_edit, can_view=data.can_view
    )

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if user == pr.player:
            await _send_game("Note.Access.Add", data.dict(), room=psid)
        elif data.name == "default" or data.name == user.name:
            if data.can_view:
                await send_create_note(note, psid)


@sio.on("Note.Access.Edit", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def edit_note_access(sid, raw_data: Any):
    data = ApiNoteAccessEdit(**raw_data)
    uuid = data.note

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update a note not belonging to them.")
        return

    old_default_can_view = False
    default_can_view = False
    user_view = {}

    for access in note.access:
        if not access.user:
            old_default_can_view = access.can_view
        else:
            user_view[access.user] = {"old": access.can_view}

        if (access.user and access.user.name == data.name) or (
            not access.user and data.name == "default"
        ):
            with db.atomic():
                access.can_edit = data.can_edit
                access.can_view = data.can_view
                access.save()

        if not access.user:
            default_can_view = access.can_view
        else:
            user_view[access.user]["new"] = access.can_view

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if user == pr.player:
            await _send_game("Note.Access.Edit", data.dict(), room=psid)
        elif data.name == "default" or data.name == user.name:
            can_view = default_can_view or user_view.get(user, {}).get("new", False)
            old_can_view = old_default_can_view or user_view.get(user, {}).get(
                "old", False
            )

            if can_view != old_can_view:
                if data.can_view:
                    await send_create_note(note, psid)
                else:
                    await send_remove_note(uuid, psid)
            else:
                await _send_game("Note.Access.Edit", data.dict(), room=psid)


@sio.on("Note.Access.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_note_access(sid, raw_data: Any):
    data = ApiNoteSetString(**raw_data)
    uuid = data.uuid

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update a note not belonging to them.")
        return

    default_can_view = False
    for access in note.access:
        if not access.user:
            default_can_view = access.can_view
        elif access.user.name == data.value:
            access.delete_instance()
            break

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if user == pr.player or default_can_view:
            await _send_game("Note.Access.Remove", data.dict(), room=psid)
        elif data.value == user.name:
            await send_remove_note(uuid, psid)


@sio.on("Note.Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape(sid, raw_data: Any):
    data = ApiNoteShape(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    uuid = data.note_id

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to add shape to non-existent note with id: '{uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(
            f"{pr.player.name} tried to add a shape to a note not belonging to them."
        )
        return

    NoteShape.create(note_id=note, shape_id=data.shape_id)

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Shape.Add", data.dict(), room=psid)


@sio.on("Note.Shape.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shape(sid, raw_data: Any):
    data = ApiNoteShape(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    uuid = data.note_id

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to add shape to non-existent note with id: '{uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(
            f"{pr.player.name} tried to add a shape to a note not belonging to them."
        )
        return

    NoteShape.get(note_id=note, shape_id=data.shape_id).delete_instance()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Shape.Remove", data.dict(), room=psid)


@sio.on("Note.ShowOnHover.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_on_hover(sid: str, raw_data: Any):
    data = ApiNoteSetBoolean(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    note.show_on_hover = data.value
    note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.ShowOnHover.Set", data.dict(), room=psid)


@sio.on("Note.ShowIconOnShape.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_icon_on_shape(sid: str, raw_data: Any):
    data = ApiNoteSetBoolean(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(
            f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'"
        )
        return

    if not can_edit(note, pr.player):
        logger.warn(f"{pr.player.name} tried to update note not belonging to them.")
        return

    note.show_icon_on_shape = data.value
    note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.ShowIconOnShape.Set", data.dict(), room=psid)
