import uuid

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import PlayerRoom
from models.role import Role
from state.game import game_state


@sio.on("Room.Info.InviteCode.Refresh", namespace=GAME_NS)
@auth.login_required(app, sio)
async def refresh_invite_code(sid: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to refresh the invitation code.")
        return

    pr.room.invitation_code = uuid.uuid4()
    pr.room.save()

    await sio.emit(
        "Room.Info.InvitationCode.Set",
        str(pr.room.invitation_code),
        room=sid,
        namespace=GAME_NS,
    )


@sio.on("Room.Info.Players.Kick", namespace=GAME_NS)
@auth.login_required(app, sio)
async def kick_player(sid: int, player_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to refresh the invitation code.")
        return

    pr = PlayerRoom.get_or_none(player=player_id, room=pr.room)
    if pr:
        for psid in game_state.get_sids(player=pr.player, room=pr.room):
            await sio.disconnect(psid, namespace=GAME_NS)
        pr.delete_instance(True)


@sio.on("Room.Delete", namespace=GAME_NS)
@auth.login_required(app, sio)
async def delete_session(sid: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to REMOVE A SESSION.")
        return

    pr.room.delete_instance(True)


@sio.on("Room.Info.Set.Locked", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_locked_game_state(sid: int, is_locked: bool):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set the locked game_state.")
        return

    pr.room.is_locked = is_locked
    pr.room.save()
    for psid, player in game_state.get_users(room=pr.room):
        if player != pr.room.creator:
            await sio.disconnect(psid, namespace=GAME_NS)
