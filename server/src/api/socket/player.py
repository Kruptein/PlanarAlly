from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom
from models.role import Role
from models.user import User
from state.game import game_state
from logs import logger


class BringPlayersData(TypedDict):
    floor: str
    x: int
    y: int
    zoom: int


class PlayerRoleChange(TypedDict):
    player: int
    role: int


@sio.on("Players.Bring", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def bring_players(sid: str, data: BringPlayersData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to bring all players")
        return

    await sio.emit(
        "Position.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Player.Role.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_player_role(sid: str, data: PlayerRoleChange):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change the role of a player")
        return

    new_role = Role(data["role"])

    player_pr: PlayerRoom = PlayerRoom.get(player=data["player"], room=pr.room)
    creator: User = player_pr.room.creator

    if pr.player != creator and creator == player_pr.player:
        logger.warning(
            f"{pr.player.name} attempted to change the role of the campaign creator"
        )
        return

    player_pr.role = new_role
    player_pr.save()

    for sid in game_state.get_sids(player=player_pr.player, room=pr.room):
        await sio.disconnect(sid, namespace=GAME_NS)

    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role == Role.DM:
            await sio.emit("Player.Role.Set", data, room=psid, namespace=GAME_NS)
