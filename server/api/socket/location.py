from typing import Any, Dict, List

from peewee import JOIN
from playhouse.shortcuts import update_model_from_dict

import auth
from .initiative import send_client_initiatives
from app import app, logger, sio
from models import (
    Floor,
    Initiative,
    InitiativeLocationData,
    Layer,
    Location,
    LocationUserOption,
    Marker,
    Note,
    PlayerRoom,
    Room,
    Shape,
)
from models.role import Role
from state.game import game_state


@auth.login_required(app, sio)
async def load_location(sid: int, location: Location):
    pr: PlayerRoom = game_state.get(sid)
    if pr.active_location != location:
        pr.active_location = location
        pr.save()

    data = {}
    data["locations"] = [l.name for l in pr.room.locations.order_by(Location.index)]
    data["floors"] = [
        f.as_dict(pr.player, pr.player == pr.room.creator)
        for f in location.floors.order_by(Floor.index)
    ]
    client_options = pr.player.as_dict()
    client_options.update(
        **LocationUserOption.get(user=pr.player, location=location).as_dict()
    )

    await sio.emit("Board.Set", data, room=sid, namespace="/planarally")
    await sio.emit(
        "Location.Set", location.as_dict(), room=sid, namespace="/planarally"
    )
    await sio.emit(
        "Client.Options.Set", client_options, room=sid, namespace="/planarally"
    )
    await sio.emit(
        "Notes.Set",
        [
            note.as_dict()
            for note in Note.select().where(
                (Note.user == pr.player) & (Note.room == pr.room)
            )
        ],
        room=sid,
        namespace="/planarally",
    )
    await sio.emit(
        "Markers.Set",
        [
            marker.as_string()
            for marker in Marker.select(Marker.shape_id).where(
                (Marker.user == pr.player) & (Marker.location == location)
            )
        ],
        room=sid,
        namespace="/planarally",
    )

    location_data = InitiativeLocationData.get_or_none(location=location)
    if location_data:
        await send_client_initiatives(pr, pr.player)
        await sio.emit(
            "Initiative.Round.Update",
            location_data.round,
            room=sid,
            namespace="/planarally",
        )
        await sio.emit(
            "Initiative.Turn.Set", location_data.turn, room=sid, namespace="/planarally"
        )


@sio.on("Location.Change", namespace="/planarally")
@auth.login_required(app, sio)
async def change_location(sid: int, data: Dict[str, str]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change location")
        return

    new_location = pr.room.locations.where(Location.name == data["location"])

    for room_player in pr.room.players:
        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            sio.leave_room(
                psid, room_player.active_location.get_path(), namespace="/planarally"
            )
            sio.enter_room(psid, new_location.get_path(), namespace="/planarally")
            await load_location(psid, new_location)
        room_player.active_location = new_location
        room_player.save()


@sio.on("Location.Options.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_location_options(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set a room option")
        return

    update_model_from_dict(pr.active_location, data)
    pr.active_location.save()

    await sio.emit(
        "Location.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Location.New", namespace="/planarally")
@auth.login_required(app, sio)
async def add_new_location(sid: int, location: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to add a new location")
        return

    new_location = Location.create(room=pr.room, name=location)
    new_location.create_floor()

    await load_location(sid, new_location)


@sio.on("Locations.Order.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_locations_order(sid: int, locations: List[str]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to reorder locations.")
        return

    location_query = Location.select().where(Location.room == pr.room)
    for i, location in enumerate(locations):
        l: Location = location_query.where(Location.name == location)[0]
        l.index = i + 1
        l.save()

    for player_room in pr.room.players:
        if player_room.role != Role.DM:
            continue
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await sio.emit(
                "Locations.Order.Set", locations, room=psid, namespace="/planarally"
            )
