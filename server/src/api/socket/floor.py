from typing import Any, List

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import Floor, PlayerRoom
from ...models.db import db
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.floor import FloorCreate, FloorRename
from ..models.floor.background import FloorBackgroundSet
from ..models.floor.type import FloorTypeSet
from ..models.floor.visible import FloorVisibleSet


@sio.on("Floor.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_floor(sid: str, floor_name: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to create a new floor")
        return

    floor = pr.active_location.create_floor(floor_name)

    for psid, player in game_state.get_users(active_location=pr.active_location):
        await _send_game(
            "Floor.Create",
            FloorCreate(
                creator=pr.player.name,
                floor=floor.as_pydantic(player, game_state.get(psid).role == Role.DM),
            ),
            room=psid,
        )


@sio.on("Floor.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_floor(sid: str, floor_name: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to remove a floor")
        return

    floor = Floor.get(location=pr.active_location, name=floor_name)
    floor.delete_instance(recursive=True)

    await _send_game(
        "Floor.Remove",
        floor_name,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Floor.Visible.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_visibility(sid: str, raw_data: Any):
    data = FloorVisibleSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to toggle floor visibility")
        return

    floor = Floor.get(location=pr.active_location, name=data.name)
    floor.player_visible = data.visible
    floor.save()

    await _send_game(
        "Floor.Visible.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Floor.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_floor(sid: str, raw_data: Any):
    data = FloorRename(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a floor")
        return

    floor: Floor = Floor.get(location=pr.active_location, index=data.index)
    floor.name = data.name
    floor.save()

    await _send_game(
        "Floor.Rename",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Floor.Type.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_type(sid: str, raw_data: Any):
    data = FloorTypeSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set floor type")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data.name)
    floor.type_ = data.floorType
    floor.save()

    await _send_game(
        "Floor.Type.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Floor.Background.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_background(sid: str, raw_data: Any):
    data = FloorBackgroundSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set floor background")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data.name)
    floor.background_color = data.background or None
    floor.save()

    await _send_game(
        "Floor.Background.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Floors.Reorder", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def reorder_floors(sid: str, data: List[str]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to reorder floors")
        return

    with db.atomic():
        for i, name in enumerate(data):
            init = Floor.get(location=pr.active_location, name=name)
            init.index = i
            init.save()

    await _send_game(
        "Floors.Reorder",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )
