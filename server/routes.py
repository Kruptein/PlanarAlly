import aiohttp
import aiohttp_jinja2

from aiohttp import web
from aiohttp_security import authorized_userid, check_authorized, forget, remember

from app import app, logger
from models import Location, PlayerRoom, Room, User
from models.db import db
from models.role import Role


async def root(request):
    return web.FileResponse("./templates/index.html")


async def root_dev(request):
    target_url = f"http://localhost:8080{request.rel_url}"
    data = await request.read()
    get_data = request.rel_url.query
    async with aiohttp.ClientSession() as session:
        async with session.request(
            "get", target_url, headers=request.headers, params=get_data, data=data
        ) as resp:
            response = resp
            raw = await response.read()

    return web.Response(body=raw, status=response.status, headers=response.headers)


@aiohttp_jinja2.template("planarally.jinja2")
async def show_room(request):
    user = await check_authorized(request)
    creator = User.by_name(request.match_info["username"])
    try:
        room = Room.select().where(
            (Room.creator == creator) & (Room.name == request.match_info["roomname"])
        )[0]
    except IndexError:
        logger.info(
            f"{user.name} attempted to load non existing room {request.match_info['username']}/{request.match_info['roomname']}"
        )
    else:
        for pr in room.players:
            if pr.user == user:
                return {"dm": pr.role == Role.DM}
    return web.HTTPFound("/rooms")


@aiohttp_jinja2.template("assets.jinja2")
async def show_assets(request):
    await check_authorized(request)
