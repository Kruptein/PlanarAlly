from typing import Union

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import Marker, PlayerRoom
from models.role import Role
from models.shape import Shape
from state.game import game_state


@sio.on("Logic.Door.Request", namespace=GAME_NS)
@auth.login_required(app, sio)
async def door_request(sid: str, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    shape: Union[Shape, None] = Shape.get_or_none(uuid=uuid)
    if not shape:
        return

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role == Role.DM:
            await sio.emit(
                "Logic.Door.Request",
                {"shape": uuid, "requester": pr.player.name},
                room=psid,
                namespace=GAME_NS,
            )


@sio.on("Logic.Door.Request.Decline", namespace=GAME_NS)
@auth.login_required(app, sio)
async def decline_door_request(sid: str, name: str):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).player.name == name:
            await sio.emit(
                "Logic.Door.Request.Declined",
                room=psid,
                namespace=GAME_NS,
            )
