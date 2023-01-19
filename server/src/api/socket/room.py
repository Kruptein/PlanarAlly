import uuid

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import PlayerRoom
from ...models.role import Role
from ...models.user import User
from ...state.game import game_state
from ..helpers import _send_game


@sio.on("Room.Info.InviteCode.Refresh", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def refresh_invite_code(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to refresh the invitation code.")
        return

    pr.room.invitation_code = uuid.uuid4()
    pr.room.save()

    for room_player in pr.room.players:
        if room_player.role != Role.DM:
            continue

        for psid in game_state.get_sids(
            player=room_player.player,
            active_location=pr.active_location,
        ):
            await _send_game(
                "Room.Info.InvitationCode.Set", str(pr.room.invitation_code), room=psid
            )


@sio.on("Room.Info.Players.Kick", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def kick_player(sid: str, player_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to refresh the invitation code.")
        return

    pr = PlayerRoom.get_or_none(player=player_id, room=pr.room)
    if pr is None:
        return

    creator: User = pr.room.creator

    if pr.player != creator and creator == pr.player:
        logger.warning(f"{pr.player.name} attempted to kick the campaign creator")
        return

    for psid in game_state.get_sids(player=pr.player, room=pr.room):
        await sio.disconnect(psid, namespace=GAME_NS)
    pr.delete_instance(True)


@sio.on("Room.Delete", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_session(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to REMOVE A SESSION.")
        return

    pr.room.delete_instance(True)


@sio.on("Room.Info.Set.Locked", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_locked_game_state(sid: str, is_locked: bool):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set the locked game_state.")
        return

    pr.room.is_locked = is_locked
    pr.room.save()
    for psid in game_state.get_sids(room=pr.room):
        if game_state.get(psid).role != Role.DM:
            await sio.disconnect(psid, namespace=GAME_NS)
