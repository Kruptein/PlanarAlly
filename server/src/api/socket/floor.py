from typing import List, Optional, cast
from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import Floor, PlayerRoom
from models.db import db
from models.role import Role
from state.game import game_state
from logs import logger

# DATA CLASSES FOR TYPE CHECKING
class FloorRename(TypedDict):
    index: int
    name: str


class FloorVisibleData(TypedDict):
    name: str
    visible: bool


class FloorTypeData(TypedDict):
    name: str
    floorType: int


class FloorBackgroundData(TypedDict):
    name: str
    background: Optional[str]


@sio.on("Floor.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_floor(sid: str, data: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to create a new floor")
        return

    floor: Floor = pr.active_location.create_floor(data)

    for psid, player in game_state.get_users(active_location=pr.active_location):
        await sio.emit(
            "Floor.Create",
            {
                "floor": floor.as_dict(
                    player, cast(bool, game_state.get(psid).role == Role.DM)
                ),
                "creator": pr.player.name,
            },
            room=psid,
            namespace=GAME_NS,
        )


@sio.on("Floor.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_floor(sid: str, data: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to remove a floor")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data)
    floor.delete_instance(recursive=True)

    await sio.emit(
        "Floor.Remove",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Floor.Visible.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_visibility(sid: str, data: FloorVisibleData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to toggle floor visibility")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["name"])
    floor.player_visible = data["visible"]
    floor.save()

    await sio.emit(
        "Floor.Visible.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Floor.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_floor(sid: str, data: FloorRename):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a floor")
        return

    floor: Floor = Floor.get(location=pr.active_location, index=data["index"])
    floor.name = data["name"]
    floor.save()

    await sio.emit(
        "Floor.Rename",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Floor.Type.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_type(sid: str, data: FloorTypeData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set floor type")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["name"])
    floor.type_ = data["floorType"]
    floor.save()

    await sio.emit(
        "Floor.Type.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Floor.Background.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_floor_background(sid: str, data: FloorBackgroundData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set floor background")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["name"])
    floor.background_color = data.get("background", None)
    floor.save()

    await sio.emit(
        "Floor.Background.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
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

    await sio.emit(
        "Floors.Reorder",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )
