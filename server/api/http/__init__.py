from aiohttp import web
from aiohttp_security import check_authorized

import api.http.auth
import api.http.rooms
import api.http.users
import api.http.version

from api.socket.constants import GAME_NS
from app import sio
from models import PlayerRoom, Room
from models.role import Role
from state.game import game_state

import urllib.parse


async def claim_invite(request):
    user = await check_authorized(request)
    data = await request.json()
    room = Room.get_or_none(invitation_code=data["code"])
    if room is None:
        return web.HTTPNotFound()
    else:
        if user != room.creator and not PlayerRoom.get_or_none(player=user, room=room):
            query = PlayerRoom.select().where(PlayerRoom.room == room)
            try:
                loc = query.where(PlayerRoom.role == Role.PLAYER)[0].active_location
            except IndexError:
                loc = query.where(PlayerRoom.role == Role.DM)[0].active_location
            PlayerRoom.create(
                player=user, room=room, role=Role.PLAYER, active_location=loc
            )

            for csid in game_state.get_sids(player=room.creator, room=room):
                await sio.emit(
                    "Room.Info.Players.Add",
                    {"id": user.id, "name": user.name},
                    room=csid,
                    namespace=GAME_NS,
                )
        return web.json_response(
            {
                "sessionUrl": f"/game/{urllib.parse.quote(room.creator.name, safe='')}/{urllib.parse.quote(room.name, safe='')}"
            }
        )
