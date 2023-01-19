from datetime import date
from urllib.parse import unquote

from aiohttp_security import authorized_userid

from ..models.client import ClientConnected, ClientDisconnected

from ..helpers import _send_game

from ...api.socket.constants import GAME_NS
from ...app import sio
from ...logs import logger
from ...models import PlayerRoom, Room
from ...models.role import Role
from ...models.user import User
from ...state.game import game_state


@sio.on("connect", namespace=GAME_NS)
async def connect(sid, environ):
    user: User | None = await authorized_userid(environ["aiohttp.request"])

    if user is None:
        await _send_game("redirect", "/", room=sid)
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
    sio.enter_room(sid, pr.room.get_path(), namespace=GAME_NS)

    await _send_game(
        "Client.Connected",
        ClientConnected(player=user.id, client=sid),
        room=pr.room.get_path(),
        skip_sid=sid,
    )


@sio.on("disconnect", namespace=GAME_NS)
async def disconnect(sid):
    if not game_state.has_sid(sid):
        return

    pr = game_state.get(sid)

    logger.info(f"User {pr.player.name} disconnected with identifier {sid}")
    try:
        await game_state.remove_sid(sid)
    except:
        logger.exception("Failed to remove client sid properly")

    await _send_game(
        "Client.Disconnected",
        ClientDisconnected(client=sid),
        room=pr.room.get_path(),
        skip_sid=sid,
    )
