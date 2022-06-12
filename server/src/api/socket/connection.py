from datetime import date
from urllib.parse import unquote

from aiohttp_security import authorized_userid

from api.socket.constants import GAME_NS
from app import sio
from models import PlayerRoom, Room, User
from models.role import Role
from state.game import game_state
from logs import logger


@sio.on("connect", namespace=GAME_NS)
async def connect(sid, environ):
    user = await authorized_userid(environ["aiohttp.request"])

    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace=GAME_NS)
        return

    ref = {
        k.split("=")[0]: k.split("=")[1]
        for k in unquote(environ["QUERY_STRING"]).strip().split("&")
    }
    try:
        room = (
            Room.select()
            .join(User)
            .where((Room.name == ref["room"]) & (User.name == ref["user"]))[0]
        )
    except IndexError:
        return False
    else:
        for pr in room.players:
            if pr.player == user:
                if pr.role != Role.DM and room.is_locked:
                    return False
                break
        else:
            return False

    pr: PlayerRoom = PlayerRoom.get(room=room, player=user)
    pr.last_played = date.today()
    pr.save()
    await game_state.add_sid(sid, pr)

    logger.info(f"User {user.name} connected with identifier {sid}")

    sio.enter_room(sid, pr.active_location.get_path(), namespace=GAME_NS)


@sio.on("disconnect", namespace=GAME_NS)
async def disconnect(sid):
    if not game_state.has_sid(sid):
        return

    user = game_state.get_user(sid)

    logger.info(f"User {user.name} disconnected with identifier {sid}")
    await game_state.remove_sid(sid)
