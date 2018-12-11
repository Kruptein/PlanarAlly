from aiohttp import web
from aiohttp_security import check_authorized

from models import Location, Room, User
from models.db import db


async def get_list(request):
    user = await check_authorized(request)
    return web.json_response(
        {
            "owned": [
                (r.name, r.creator.name)
                for r in user.rooms_created.select(Room.name, User.name).join(User)
            ],
            "joined": [
                (r.room.name, r.room.creator.name)
                for r in user.rooms_joined.select(Room.name, User.name)
                .join(Room)
                .join(User)
            ],
        }
    )


async def create(request):
    user = await check_authorized(request)
    data = await request.json()
    roomname = data["name"]
    if not roomname:
        return web.HTTPBadRequest()
    else:
        with db.atomic():
            room = Room.create(name=roomname, creator=user)
            loc = Location.create(room=room, name="start")
            loc.add_default_layers()
            room.dm_location = loc.name
            room.player_location = loc.name
            room.save()
        return web.HTTPOk()
