from aiohttp import web
from aiohttp_security import check_authorized

from models import Room, User


async def show_rooms(request):
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
