from aiohttp import web
from aiohttp_security import check_authorized

import api.http.auth
import api.http.rooms
import api.http.users
import api.http.version

from app import sio, state
from models import PlayerRoom, Room

import urllib.parse


async def claim_invite(request):
    user = await check_authorized(request)
    data = await request.json()
    room = Room.get_or_none(invitation_code=data["code"])
    if room is None:
        return web.HTTPNotFound()
    else:
        if user.name != room.creator and not PlayerRoom.get_or_none(
            player=user, room=room
        ):
            PlayerRoom.create(player=user, room=room)

            for csid in state.get_sids(user=room.creator, room=room):
                await sio.emit(
                    "Room.Info.Players.Add",
                    {"id": user.id, "name": user.name},
                    room=csid,
                    namespace="/planarally",
                )
        return web.json_response(
            {
                "sessionUrl": f"/game/{urllib.parse.quote(room.creator.name, safe='')}/{urllib.parse.quote(room.name, safe='')}"
            }
        )
