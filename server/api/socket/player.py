from typing import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom
from models.role import Role
from state.game import game_state
from utils import logger


class BringPlayersData(TypedDict):
    floor: str
    x: int
    y: int
    zoom: int


class PlayerRoleChange(TypedDict):
    player: int
    role: int


@sio.on("Players.Bring", namespace=GAME_NS)
@auth.login_required(app, sio)
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
@auth.login_required(app, sio)
async def set_player_role(sid: str, data: PlayerRoleChange):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change the role of a player")
        return

    new_role = Role(data["role"])

    player_pr: PlayerRoom = PlayerRoom.get(player=data["player"], room=pr.room)
    player_pr.role = new_role
    player_pr.save()
