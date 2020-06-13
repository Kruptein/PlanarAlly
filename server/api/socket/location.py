import json
from typing import Any, Dict, List

from peewee import JOIN
from playhouse.shortcuts import update_model_from_dict

import auth
from .initiative import send_client_initiatives
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import (
    Floor,
    Initiative,
    InitiativeLocationData,
    Layer,
    Location,
    LocationOptions,
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
    data["locations"] = [
        {"id": l.id, "name": l.name} for l in pr.room.locations.order_by(Location.index)
    ]
    data["floors"] = [
        f.as_dict(pr.player, pr.player == pr.room.creator)
        for f in location.floors.order_by(Floor.index)
    ]
    client_options = pr.player.as_dict()
    client_options.update(
        **LocationUserOption.get(user=pr.player, location=location).as_dict()
    )

    await sio.emit("Board.Set", data, room=sid, namespace=GAME_NS)
    await sio.emit("Location.Set", location.as_dict(), room=sid, namespace=GAME_NS)
    await sio.emit("Client.Options.Set", client_options, room=sid, namespace=GAME_NS)
    await sio.emit(
        "Notes.Set",
        [
            note.as_dict()
            for note in Note.select().where(
                (Note.user == pr.player) & (Note.room == pr.room)
            )
        ],
        room=sid,
        namespace=GAME_NS,
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
        namespace=GAME_NS,
    )

    location_data = InitiativeLocationData.get_or_none(location=location)
    if location_data:
        await send_client_initiatives(pr, pr.player)
        await sio.emit(
            "Initiative.Round.Update", location_data.round, room=sid, namespace=GAME_NS,
        )
        await sio.emit(
            "Initiative.Turn.Set", location_data.turn, room=sid, namespace=GAME_NS
        )


@sio.on("Location.Change", namespace=GAME_NS)
@auth.login_required(app, sio)
async def change_location(sid: int, data: Dict[str, str]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change location")
        return

    # Send an anouncement to show loading state
    for room_player in pr.room.players:
        if not room_player.player.name in data["users"]:
            continue

        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            await sio.emit("Location.Change.Start", room=psid, namespace=GAME_NS)

    new_location = Location[data["location"]]

    for room_player in pr.room.players:
        if not room_player.player.name in data["users"]:
            continue

        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            sio.leave_room(
                psid, room_player.active_location.get_path(), namespace=GAME_NS
            )
            sio.enter_room(psid, new_location.get_path(), namespace=GAME_NS)
            await load_location(psid, new_location)
        room_player.active_location = new_location
        room_player.save()


@sio.on("Location.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_location_options(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set a room option")
        return

    if data.get("location", None) is None:
        options = pr.room.default_options
    else:
        loc = Location[data["location"]]
        if loc.options is None:
            loc.options = LocationOptions.create(
                unit_size=None,
                unit_size_unit=None,
                use_grid=None,
                full_fow=None,
                fow_opacity=None,
                fow_los=None,
                vision_mode=None,
                grid_size=None,
                vision_min_range=None,
                vision_max_range=None,
            )
            loc.save()
        options = loc.options

    update_model_from_dict(options, data["options"])
    options.save()

    if data.get("location", None) is None:
        for sid in game_state.get_sids(skip_sid=sid, room=pr.room):
            await sio.emit("Location.Options.Set", data, room=sid, namespace=GAME_NS)
    else:
        await sio.emit(
            "Location.Options.Set",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
        )


@sio.on("Location.New", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_new_location(sid: int, location: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to add a new location")
        return

    new_location = Location.create(
        room=pr.room, name=location, index=pr.room.locations.count()
    )
    new_location.create_floor()

    for psid in game_state.get_sids(
        player=pr.player, active_location=pr.active_location
    ):
        sio.leave_room(psid, pr.active_location.get_path(), namespace=GAME_NS)
        sio.enter_room(psid, new_location.get_path(), namespace=GAME_NS)
        await load_location(psid, new_location)
    pr.active_location = new_location
    pr.save()


@sio.on("Locations.Order.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_locations_order(sid: int, locations: List[int]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to reorder locations.")
        return

    for i, idx in enumerate(locations):
        l: Location = Location[idx]
        l.index = i + 1
        l.save()

    for player_room in pr.room.players:
        if player_room.role != Role.DM:
            continue
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await sio.emit(
                "Locations.Order.Set", locations, room=psid, namespace=GAME_NS
            )


@sio.on("Location.Rename", namespace=GAME_NS)
@auth.login_required(app, sio)
async def rename_location(sid: int, data: Dict[str, str]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a location.")
        return

    location = Location[data["id"]]
    location.name = data["new"]
    location.save()

    for player_room in pr.room.players:
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await sio.emit("Location.Rename", data, room=psid, namespace=GAME_NS)


@sio.on("Location.Delete", namespace=GAME_NS)
@auth.login_required(app, sio)
async def delete_location(sid: int, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a location.")
        return

    location = Location[location_id]

    if location.players.count() > 0:
        logger.error(
            "A location was attempted to be removed that still has players! This has been prevented"
        )
        return

    location.delete_instance(recursive=True)


@sio.on("Location.Spawn.Info.Get", namespace=GAME_NS)
@auth.login_required(app, sio)
async def get_location_spawn_info(sid: int, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to retrieve spawn locations.")
        return

    location = Location[location_id]

    data = []

    for spawn in json.loads(location.options.spawn_locations):
        shape = Shape[spawn]
        data.append(shape.as_dict(pr.player, True))

    await sio.emit("Location.Spawn.Info", data=data, room=sid, namespace=GAME_NS)
