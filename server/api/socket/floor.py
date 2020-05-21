from typing import Any, Dict

import auth
from app import app, logger, sio
from models import Floor, Room, PlayerRoom
from models.role import Role
from state.game import game_state


@sio.on("Floor.Create", namespace="/planarally")
@auth.login_required(app, sio)
async def create_floor(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to create a new floor")
        return

    floor: Floor = pr.active_location.create_floor(data)

    for psid, player in game_state.get_users(active_location=pr.active_location):
        await sio.emit(
            "Floor.Create",
            { "floor": floor.as_dict(player, player == pr.room.creator), "creator": pr.player.name },
            room=psid,
            namespace="/planarally",
        )


@sio.on("Floor.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def remove_floor(sid, data):
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
        namespace="/planarally",
    )
