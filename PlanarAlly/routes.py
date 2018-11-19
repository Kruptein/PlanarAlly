import aiohttp_jinja2
from aiohttp import web
from aiohttp_security import authorized_userid, check_authorized, forget, remember

from app import app, logger
from models import Location, PlayerRoom, Room, User
from models.db import db


@aiohttp_jinja2.template("app.jinja2")
async def root(request):
    return {}


async def create_room(request):
    user = await check_authorized(request)
    data = await request.post()
    roomname = data["room_name"]
    if not roomname:
        response = web.HTTPFound("/rooms")
    else:
        with db.atomic():
            room = Room.create(name=roomname, creator=user)
            loc = Location.create(room=room, name="start")
            loc.add_default_layers()
            room.dm_location = loc.name
            room.player_location = loc.name
            room.save()
        response = web.HTTPFound(f"/rooms/{user.name}/{roomname}")
    return response


@aiohttp_jinja2.template("planarally.jinja2")
async def show_room(request):
    user = await check_authorized(request)
    creator = User.by_name(request.match_info["username"])
    try:
        room = (
            Room.select()
            .join(User)
            .where(
                (Room.creator == creator)
                & (Room.name == request.match_info["roomname"])
            )[0]
        )
    except IndexError:
        logger.info(
            f"{user.name} attempted to load non existing room {request.match_info['username']}/{request.match_info['roomname']}"
        )
    else:
        if room.creator == user:
            return {"dm": True}
        if user.name.lower() in (
            pr.player.name.lower() for pr in room.players.select().join(User)
        ):
            return {"dm": False}
    return web.HTTPFound("/rooms")


async def claim_invite(request):
    user = await check_authorized(request)
    room = Room.get_or_none(invitation_code=request.match_info["code"])
    if room is None:
        return web.HTTPNotFound()
    else:
        if user.name != room.creator and not PlayerRoom.get_or_none(
            player=user, room=room
        ):
            PlayerRoom.create(player=user, room=room)
        return web.HTTPFound(f"/rooms/{room.creator.name}/{room.name}")


@aiohttp_jinja2.template("assets.jinja2")
async def show_assets(request):
    await check_authorized(request)
