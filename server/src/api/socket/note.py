import operator
from functools import reduce
from typing import Any

from peewee import JOIN, fn
from pydantic import TypeAdapter

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.db import db
from ...db.models.location import Location
from ...db.models.note import Note
from ...db.models.note_access import NoteAccess
from ...db.models.note_room import NoteRoom
from ...db.models.note_shape import NoteShape
from ...db.models.note_tag import NoteTag
from ...db.models.note_user_tag import NoteUserTag
from ...db.models.player_room import PlayerRoom
from ...db.models.room import Room
from ...db.models.shape import Shape
from ...db.models.asset_rect import AssetRect
from ...db.models.shape_room_view import ShapeRoomView
from ...db.models.user import User
from ...logs import logger
from ...state.game import game_state
from ..helpers import _send_game
from ..models.note import (
    ApiNote,
    ApiNoteAccessEdit,
    ApiNoteRoomLink,
    ApiNoteSearch,
    ApiNoteSetBoolean,
    ApiNoteSetString,
    ApiNoteShape,
    DefaultNoteFilter,
)


def can_edit(note: Note, user: User):
    return note.creator == user or any((not a.user or a.user == user) and a.can_edit for a in note.access)


def can_view(note: Note, user: User):
    return note.creator == user or any((not a.user or a.user == user) and a.can_view for a in note.access)


async def send_create_note(note: Note, psid: str):
    await _send_game("Note.Add", note.as_pydantic(), room=psid)


async def send_remove_note(uuid: str, psid: str):
    await _send_game("Note.Remove", uuid, room=psid)


async def get_room(room_creator: str, room_name: str) -> Room | None:
    creator = User.by_name(room_creator)
    if not creator:
        logger.warning(f"User {room_creator} not found ({room_creator}/{room_name})")
        return

    return Room.get_or_none(creator=creator, name=room_name)


@sio.on("Note.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_note(sid: str, note_id: str):
    pr: PlayerRoom = game_state.get(sid)
    note = Note.get_or_none(uuid=note_id)

    if not note or not can_view(note, pr.player):
        return None

    return note.as_pydantic()


@sio.on("Note.New", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def new_note(sid: str, raw_data: Any):
    data = TypeAdapter(ApiNote).validate_python(raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if Note.get_or_none(uuid=data.uuid):
        logger.warning(f"{pr.player.name} tried to overwrite existing note with id: '{data.uuid}'")
        return

    note = Note.create(
        uuid=data.uuid,
        creator=pr.player,
        title=data.title,
        text=data.text,
        tags=data.tags,
        show_on_hover=data.showOnHover,
        show_icon_on_shape=data.showIconOnShape,
    )

    for room_data in data.rooms:
        room = await get_room(room_data.roomCreator, room_data.roomName)
        if not room:
            logger.warning(f"Room {room_data.roomCreator}/{room_data.roomName} not found")
            continue
        NoteRoom.create(note=note, room=room, location=room_data.locationId)

    for psid in game_state.get_sids(skip_sid=sid, player=pr.player):
        await send_create_note(note, psid)


@sio.on("Note.Title.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_title(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.title = data.value
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Title.Set", data.model_dump(), room=psid)


@sio.on("Note.Text.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_note_text(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    with db.atomic():
        note.text = data.value
        note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Text.Set", data.model_dump(), room=psid)


@sio.on("Note.Tag.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_note_tag(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    tag, _ = NoteUserTag.get_or_create(user=pr.player, tag=data.value)

    NoteTag.create(note=note, tag=tag)

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Tag.Add", data.model_dump(), room=psid)


@sio.on("Note.Tag.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_note_tag(sid: str, raw_data: Any):
    data = ApiNoteSetString(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    for tag in note.tags.join(NoteUserTag).where(NoteUserTag.tag == data.value):
        if tag.tag.note_tags.count() == 1:
            tag.tag.delete_instance()
        else:
            tag.delete_instance()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Tag.Remove", data.model_dump(), room=psid)


@sio.on("Note.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_note(sid, uuid):
    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to remove non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to remove a note not belonging to them.")
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
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update a note not belonging to them.")
        return

    user = None
    if data.name != "default":
        user = User.by_name(data.name)
    elif note.rooms.count() == 0:
        logger.warning(f"Note '{uuid}' is global but tried to add default access")
        return

    NoteAccess.create(note=note, user=user, can_edit=data.can_edit, can_view=data.can_view)

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if user == pr.player:
            await _send_game("Note.Access.Add", data.model_dump(), room=psid)
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
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update a note not belonging to them.")
        return

    old_default_can_view = False
    default_can_view = False
    user_view = {}

    for access in note.access:
        if not access.user:
            old_default_can_view = access.can_view
        else:
            user_view[access.user] = {"old": access.can_view}

        if (access.user and access.user.name == data.name) or (not access.user and data.name == "default"):
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
            await _send_game("Note.Access.Edit", data.model_dump(), room=psid)
        elif data.name == "default" or data.name == user.name:
            can_view = default_can_view or user_view.get(user, {}).get("new", False)
            old_can_view = old_default_can_view or user_view.get(user, {}).get("old", False)

            if can_view != old_can_view:
                if data.can_view:
                    await send_create_note(note, psid)
                else:
                    await send_remove_note(uuid, psid)
            else:
                await _send_game("Note.Access.Edit", data.model_dump(), room=psid)


@sio.on("Note.Access.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_note_access(sid, raw_data: Any):
    data = ApiNoteSetString(**raw_data)
    uuid = data.uuid

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update a note not belonging to them.")
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
            await _send_game("Note.Access.Remove", data.model_dump(), room=psid)
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
        logger.warning(f"{pr.player.name} tried to add shape to non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to add a shape to a note not belonging to them.")
        return

    NoteShape.create(note_id=note, shape_id=data.shape_id)

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Shape.Add", data.model_dump(), room=psid)


@sio.on("Note.Shape.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shape(sid, raw_data: Any):
    data = ApiNoteShape(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    uuid = data.note_id

    note = Note.get_or_none(uuid=uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to add shape to non-existent note with id: '{uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to add a shape to a note not belonging to them.")
        return

    NoteShape.get(note_id=note, shape_id=data.shape_id).delete_instance()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Shape.Remove", data.model_dump(), room=psid)


@sio.on("Note.Room.Link", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def link_note_to_room(sid: str, raw_data: Any):
    data = ApiNoteRoomLink(**raw_data)

    pr: PlayerRoom = game_state.get(sid)
    note = Note.get_or_none(uuid=data.note)

    if not note:
        logger.warning(f"{pr.player.name} tried to link non-existent note with id: '{data.note}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to link a note not belonging to them.")
        return

    room = await get_room(data.roomCreator, data.roomName)
    if not room:
        return

    if note.rooms.filter(room=room, location=data.locationId).exists():
        logger.warning(f"Note {data.note} already linked to room {data.roomCreator}/{data.roomName}")
        return

    NoteRoom.create(note=note, room=room, location=data.locationId)

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Room.Link", data.model_dump(), room=psid)


@sio.on("Note.Room.Unlink", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def unlink_note_from_room(sid: str, raw_data: Any):
    data = ApiNoteRoomLink(**raw_data)

    pr: PlayerRoom = game_state.get(sid)
    note = Note.get_or_none(uuid=data.note)

    if not note:
        logger.warning(f"{pr.player.name} tried to unlink non-existent note with id: '{data.note}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to unlink a note not belonging to them.")
        return

    room = await get_room(data.roomCreator, data.roomName)
    if not room:
        return

    nr = NoteRoom.get_or_none(note=note, room=room, location=data.locationId)
    if nr:
        nr.delete_instance()
    else:
        logger.warning(f"Note {data.note} not linked to room {data.roomCreator}/{data.roomName}")
        return

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.Room.Unlink", data.model_dump(), room=psid)


@sio.on("Note.ShowOnHover.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_on_hover(sid: str, raw_data: Any):
    data = ApiNoteSetBoolean(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    note.show_on_hover = data.value
    note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.ShowOnHover.Set", data.model_dump(), room=psid)


@sio.on("Note.ShowIconOnShape.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_icon_on_shape(sid: str, raw_data: Any):
    data = ApiNoteSetBoolean(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    note = Note.get_or_none(uuid=data.uuid)

    if not note:
        logger.warning(f"{pr.player.name} tried to update non-existent note with id: '{data.uuid}'")
        return

    if not can_edit(note, pr.player):
        logger.warning(f"{pr.player.name} tried to update note not belonging to them.")
        return

    note.show_icon_on_shape = data.value
    note.save()

    for psid, user in game_state.get_users(skip_sid=sid, room=pr.room):
        if can_view(note, user):
            await _send_game("Note.ShowIconOnShape.Set", data.model_dump(), room=psid)


@sio.on("Note.Search", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def search_notes(sid: str, raw_data: Any):
    data = ApiNoteSearch(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    notes_query = (
        Note.select()
        .join(NoteRoom, JOIN.LEFT_OUTER, on=(Note.uuid == NoteRoom.note_id))
        .join(NoteAccess, JOIN.LEFT_OUTER, on=(Note.uuid == NoteAccess.note_id))
        .join(NoteShape, JOIN.LEFT_OUTER, on=(Note.uuid == NoteShape.note_id))
        .join(NoteTag, JOIN.LEFT_OUTER, on=(Note.uuid == NoteTag.note_id))
        .join(ShapeRoomView, JOIN.LEFT_OUTER, on=(NoteShape.shape_id == ShapeRoomView.shape_id))
        .join(User, on=(Note.creator_id == User.id))
    )

    access_direct = (Note.creator == pr.player) | ((NoteAccess.user == pr.player) & (NoteAccess.can_view == True))  # noqa: E712
    access_default = (
        (NoteAccess.user >> None)  # type: ignore
        & (NoteAccess.can_view == True)  # noqa: E712
        & ((NoteRoom.room == pr.room) | (ShapeRoomView.room_id == pr.room.id))
    )

    notes_query = notes_query.where(access_direct | access_default)

    if data.campaign_filter == DefaultNoteFilter.ACTIVE_FILTER:
        notes_query = notes_query.where(NoteRoom.room == pr.room)
    elif data.campaign_filter == DefaultNoteFilter.NO_LINK_FILTER:
        notes_query = notes_query.where(NoteRoom.id >> None)  # type: ignore
    else:
        notes_query = notes_query.where((NoteRoom.room == pr.room) | (NoteRoom.room >> None))  # type: ignore

    # Loc filter is only relevant if we're filtering on the active campaign
    if data.campaign_filter == DefaultNoteFilter.ACTIVE_FILTER:
        loc_clauses = []
        for location_filter in data.location_filter:
            if location_filter == DefaultNoteFilter.NO_FILTER:
                # If NO_FILTER is in the list, we can match with anything, so just reset the filter and exit
                loc_clauses = []
                break
            elif location_filter == DefaultNoteFilter.NO_LINK_FILTER:
                loc_clauses.append(NoteRoom.location_id >> None)  # type: ignore
            elif location_filter == DefaultNoteFilter.ACTIVE_FILTER:
                loc_clauses.append(NoteRoom.location_id == pr.active_location.id)
            else:
                loc_clauses.append(NoteRoom.location_id == location_filter)
        if loc_clauses:
            notes_query = notes_query.where(reduce(operator.or_, loc_clauses))

    shape_clauses = []
    for shape_filter in data.shape_filter:
        if shape_filter == DefaultNoteFilter.NO_FILTER:
            shape_clauses = []
            break
        elif shape_filter == DefaultNoteFilter.NO_LINK_FILTER:
            shape_clauses.append(NoteShape.shape_id >> None)  # type: ignore
        elif shape_filter == DefaultNoteFilter.ACTIVE_FILTER:
            shape_clauses.append(~(NoteShape.shape_id >> None))  # type: ignore
        else:
            shape_clauses.append(NoteShape.shape_id == shape_filter)
    if shape_clauses:
        notes_query = notes_query.where(reduce(operator.or_, shape_clauses))

    tag_clauses = []
    for tag_filter in data.tag_filter:
        if tag_filter == DefaultNoteFilter.NO_FILTER:
            tag_clauses = []
            break
        elif tag_filter == DefaultNoteFilter.NO_LINK_FILTER:
            tag_clauses.append(NoteTag.tag >> None)  # type: ignore
        elif tag_filter == DefaultNoteFilter.ACTIVE_FILTER:
            tag_clauses.append(~(NoteTag.tag >> None))  # type: ignore
        else:
            tag_clauses.append(NoteTag.tag == tag_filter)  # type: ignore
    if tag_clauses:
        notes_query = notes_query.where(reduce(operator.or_, tag_clauses))

    search = data.search.strip().lower()
    if len(search) > 0:
        if data.search_title:
            notes_query = notes_query.where(Note.title.contains(search))  # type: ignore
        if data.search_text:
            notes_query = notes_query.where(Note.text.contains(search))  # type: ignore
        if data.search_author:
            notes_query = notes_query.where(Note.creator.name.contains(search))  # type: ignore

    notes_query = notes_query.group_by(Note.uuid)
    page_query = notes_query.paginate(data.page_number, data.page_size)

    return [
        [
            {
                "uuid": note.uuid,
                "title": note.title,
                "creator": note.creator.name,
                "tags": [tag.tag.tag for tag in note.tags],
            }
            for note in page_query
        ],
        notes_query.count(),
    ]


@sio.on("Note.Filters.Location.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_location_filters(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    location_options_query = (
        Location.select(Location.id, Location.name)
        .where(Location.room_id == pr.room.id)
        .where(fn.EXISTS(NoteRoom.select().where(NoteRoom.location_id == Location.id)))
        .dicts()
    )

    return list(location_options_query)


@sio.on("Note.Filters.Shape.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_shape_filters(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    shape_options_query = (
        NoteShape.select(Shape.uuid, Shape.name, AssetRect.src)
        .join(Shape, on=(NoteShape.shape_id == Shape.uuid))
        .join(AssetRect, on=(Shape.uuid == AssetRect.shape_id))
        .join(ShapeRoomView, on=(Shape.uuid == ShapeRoomView.shape_id))
        .where(ShapeRoomView.room_id == pr.room.id)
        .group_by(NoteShape.shape_id)
        .dicts()
    )

    return list(shape_options_query)


@sio.on("Note.Filters.Tag.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_tag_filters(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    tag_options_query = NoteUserTag.select().where(NoteUserTag.user_id == pr.player.id)

    return [tag.tag for tag in tag_options_query]
