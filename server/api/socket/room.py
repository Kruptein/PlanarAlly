import uuid

import auth
from app import app, sio, state
from models import PlayerRoom

@sio.on("Room.Info.InviteCode.Refresh", namespace="/planarally")
@auth.login_required(app, sio)
async def refresh_invite_code(sid):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to refresh the invitation code.")
        return
    
    room.invitation_code = uuid.uuid4()
    room.save()

    await sio.emit(
        "Room.Info.InvitationCode.Set",
        str(room.invitation_code),
        room=sid,
        namespace="/planarally",
    )


@sio.on("Room.Info.Players.Kick", namespace="/planarally")
@auth.login_required(app, sio)
async def kick_player(sid, playerId):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to refresh the invitation code.")
        return
    
    pr = PlayerRoom.get_or_none(player=playerId, room=room)
    if pr:
        for psid in state.get_sids(user=pr.player, room=room):
            await sio.disconnect(psid, namespace="/planarally")
        print(room.get_active_location(dm=False))
        print(state.sid_map)
        pr.delete_instance(True)
