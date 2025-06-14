import urllib.parse

from aiohttp import web

from ...auth import get_authorized_user
from ...db.models.player_room import PlayerRoom
from ...db.models.room import Room
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.room.info.player import RoomInfoPlayersAdd


async def claim_invite(request):
    user = await get_authorized_user(request)
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
            PlayerRoom.create(player=user, room=room, role=Role.PLAYER, active_location=loc)

            for csid in game_state.get_sids(player=room.creator, room=room):
                await _send_game(
                    "Room.Info.Players.Add",
                    RoomInfoPlayersAdd(id=user.id, name=user.name, location=loc.id),
                    room=csid,
                )

        creator_url = urllib.parse.quote(room.creator.name, safe="")
        room_url = urllib.parse.quote(room.name, safe="")
        return web.json_response({"sessionUrl": f"/game/{creator_url}/{room_url}"})
