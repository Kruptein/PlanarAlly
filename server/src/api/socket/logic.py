from typing import Dict

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import PlayerRoom
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.logic.request import (
    LogicDoorRequest,
    LogicRequestInfo,
    LogicTeleportRequest,
)


@sio.on("Logic.Request", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def request(sid: str, raw_data: Dict):
    logic_type = raw_data.get("logic", None)
    if logic_type == "door":
        data = LogicDoorRequest(**raw_data)
    elif logic_type == "tp":
        data = LogicTeleportRequest(**raw_data)
    else:
        logger.error(f"Unknown logic type {logic_type}")
        return

    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role == Role.DM:
            await _send_game(
                "Logic.Request",
                LogicRequestInfo(requester=pr.player.name, request=data),
                room=psid,
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
