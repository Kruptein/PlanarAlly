from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.player_room import PlayerRoom
from ...logs import logger
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.logic.request import LogicDoorRequest, LogicRequestInfo, LogicTeleportRequest


@sio.on("Logic.Request", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def request(sid: str, raw_data: dict):
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
                LogicRequestInfo(requester=pr.player.id, request=data),
                room=psid,
            )


@sio.on("Logic.Request.Decline", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def decline_request(sid: str, player_id: int):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).player.id == player_id:
            await sio.emit(
                "Logic.Request.Declined",
                room=psid,
                namespace=GAME_NS,
            )
