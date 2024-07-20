import uuid

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.player_room import PlayerRoom
from ...db.models.user import User
from ...logs import logger
from ...models.role import Role
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

    target_pr = PlayerRoom.get_or_none(player=player_id, room=pr.room)
    if target_pr is None:
        return

    creator: User = pr.room.creator

    if pr.player != creator and creator == target_pr.player:
        logger.warning(
            f"{target_pr.player.name} attempted to kick the campaign creator"
        )
        return

    for psid in game_state.get_sids(player=target_pr.player, room=target_pr.room):
        await sio.disconnect(psid, namespace=GAME_NS)
    target_pr.delete_instance(True)


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


@sio.on("Room.Features.Chat.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_chat_enabled(sid: str, is_enabled: bool):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(
            f"{pr.player.name} attempted to set the chat feature as a non DM."
        )
        return

    pr.room.enable_chat = is_enabled
    pr.room.save()

    await _send_game(
        "Room.Features.Chat.Set", is_enabled, room=pr.room.get_path(), skip_sid=sid
    )


@sio.on("Room.Features.Dice.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_dice_enabled(sid: str, is_enabled: bool):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(
            f"{pr.player.name} attempted to set the dice feature as a non DM."
        )
        return

    pr.room.enable_dice = is_enabled
    pr.room.save()

    await _send_game(
        "Room.Features.Dice.Set", is_enabled, room=pr.room.get_path(), skip_sid=sid
    )
