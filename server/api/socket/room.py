import uuid

import auth
from app import app, sio, state

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
