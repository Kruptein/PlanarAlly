from aiohttp import web
from aiohttp_security import check_authorized

from models import Location, PlayerRoom, Room, User
from models.db import db
from models.role import Role


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
            loc.create_floor()
            PlayerRoom.create(player=user, room=room, role=Role.DM, active_location=loc)
            room.save()
        return web.HTTPOk()
