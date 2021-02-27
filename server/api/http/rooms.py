from aiohttp import web
from aiohttp.web_exceptions import HTTPUnauthorized
from aiohttp_security import check_authorized

from models import Location, LocationOptions, PlayerRoom, Room, User
from models.db import db
from models.role import Role


async def get_list(request: web.Request):
    user: User = await check_authorized(request)

    return web.json_response(
        {
            "owned": [
                r.as_dashboard_dict() for r in user.rooms_created.select().join(User)
            ],
            "joined": [
                r.room.as_dashboard_dict()
                for r in user.rooms_joined.select()
                .join(Room)
                .join(User)
                .where(Room.creator != user)
            ],
        }
    )


async def get_info(request: web.Request):
    user: User = await check_authorized(request)

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    room = (
        PlayerRoom.select()
        .join(Room)
        .join(User)
        .filter(player=user)
        .where((User.name == creator) & (Room.name == roomname))
    )

    if len(room) != 1:
        return web.HTTPNotFound()

    return web.json_response(
        {
            "notes": room[0].notes,
            "last_played": None
            if room[0].last_played is None
            else room[0].last_played.strftime("%Y/%m/%d"),
        }
    )


async def set_info(request: web.Request):
    user: User = await check_authorized(request)

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    data = await request.json()

    rooms = (
        PlayerRoom.select()
        .join(Room)
        .join(User)
        .filter(player=user)
        .where((User.name == creator) & (Room.name == roomname))
    )

    if len(rooms) != 1:
        return web.HTTPNotFound()

    room = rooms[0]

    if "notes" in data:
        room.notes = data["notes"]
    room.save()

    return web.HTTPOk()


async def create(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()
    roomname = data["name"]
    logo = data["logo"]
    if not roomname:
        return web.HTTPBadRequest()
    else:

        if Room.get_or_none(name=roomname, creator=user):
            return web.HTTPConflict()

        with db.atomic():
            default_options = LocationOptions.create()
            room = Room.create(
                name=roomname,
                creator=user,
                default_options=default_options,
            )

            if logo >= 0:
                room.logo_id = logo

            loc = Location.create(room=room, name="start", index=1)
            loc.create_floor()
            PlayerRoom.create(player=user, room=room, role=Role.DM, active_location=loc)
            room.save()
        return web.HTTPOk()


async def patch(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()

    creator = request.match_info["creator"]
    roomname = request.match_info["roomname"]

    if creator != user.name:
        return web.HTTPUnauthorized()

    new_name = data.get("name")
    new_logo = data.get("logo")

    if not any([new_name, new_logo]):
        return web.HTTPBadRequest()

    room = Room.get_or_none(name=roomname, creator=user)
    if room is None:
        return web.HTTPBadRequest()

    if new_name:
        if Room.filter(name=new_name, creator=user).count() > 0:
            return web.HTTPBadRequest()

        room.name = new_name

    if new_logo:
        room.logo_id = new_logo

    room.save()
    return web.HTTPOk()
