from typing import Dict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom
from models.role import Role
from state.game import game_state


@sio.on("Logic.Request", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def request(sid: str, data: Dict):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role == Role.DM:
            await sio.emit(
                "Logic.Request",
                {**data, "requester": pr.player.name},
                room=psid,
                namespace=GAME_NS,
            )


@sio.on("Logic.Request.Decline", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def decline_request(sid: str, name: str):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).player.name == name:
            await sio.emit(
                "Logic.Request.Declined",
                room=psid,
                namespace=GAME_NS,
            )
