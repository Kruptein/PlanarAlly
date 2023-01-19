from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import PlayerRoom
from ...models.role import Role
from ...models.user import User
from ...state.game import game_state
from ..helpers import _send_game
from ..models.players import PlayersBring
from ..models.players.role import PlayerRoleSet


@sio.on("Players.Bring", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def bring_players(sid: str, raw_data: Any):
    data = PlayersBring(**raw_data)

    pr = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to bring all players")
        return

    await _send_game(
        "Position.Set", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Player.Role.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_player_role(sid: str, raw_data: Any):
    data = PlayerRoleSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change the role of a player")
        return

    new_role = Role(data.role)

    player_pr: PlayerRoom = PlayerRoom.get(player=data.player, room=pr.room)
    creator: User = player_pr.room.creator

    if pr.player != creator and creator == player_pr.player:
        logger.warning(
            f"{pr.player.name} attempted to change the role of the campaign creator"
        )
        return

    if pr.role == Role.DM and new_role != Role.DM:
        dm_players = PlayerRoom.filter(room=pr.room, role=Role.DM).where(
            PlayerRoom.player != data.player
        )
        if dm_players.count() == 0:
            logger.warning(
                f"{pr.player.name} attempted to change the role of the last dm in the campaign"
            )
            return

    player_pr.role = new_role
    player_pr.save()

    for sid in game_state.get_sids(player=player_pr.player, room=pr.room):
        await sio.disconnect(sid, namespace=GAME_NS)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role == Role.DM:
            await _send_game("Player.Role.Set", data, room=psid)
