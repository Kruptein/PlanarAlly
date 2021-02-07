import os
import sys

import aiohttp
import aiohttp_jinja2
from aiohttp import web
from aiohttp_security import authorized_userid, check_authorized, forget, remember

import api.http
from app import api_app, app as main_app
from models import Room, User
from models.role import Role
from utils import logger


subpath = os.environ.get("PA_BASEPATH", "/")
if subpath[-1] != "/":
    subpath = subpath + "/"


async def root(request):
    with open("./templates/index.html", "rb") as f:
        data = f.read()
        data = data.replace(b"/static", bytes(subpath, "utf-8")[:-1] + b"/static")
        return web.Response(body=data, content_type="text/html")


async def root_dev(request):
    target_url = f"http://localhost:8080{request.rel_url}"
    data = await request.read()
    get_data = request.rel_url.query
    async with aiohttp.ClientSession() as session:
        async with session.request(
            "get", target_url, headers=request.headers, params=get_data, data=data
        ) as response:
            raw = await response.read()
            raw = raw.replace(b"$BASE_PATH$", bytes(subpath, "utf-8")[:-1])

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


# MAIN ROUTES

main_app.router.add_static(f"{subpath}static", "static")
main_app.router.add_get(f"{subpath}api/auth", api.http.auth.is_authed)
main_app.router.add_post(f"{subpath}api/users/email", api.http.users.set_email)
main_app.router.add_post(f"{subpath}api/users/password", api.http.users.set_password)
main_app.router.add_post(f"{subpath}api/users/delete", api.http.users.delete_account)
main_app.router.add_post(f"{subpath}api/login", api.http.auth.login)
main_app.router.add_post(f"{subpath}api/register", api.http.auth.register)
main_app.router.add_post(f"{subpath}api/logout", api.http.auth.logout)
main_app.router.add_get(f"{subpath}api/rooms", api.http.rooms.get_list)
main_app.router.add_post(f"{subpath}api/rooms", api.http.rooms.create)
main_app.router.add_post(f"{subpath}api/invite", api.http.claim_invite)
main_app.router.add_get(f"{subpath}api/version", api.http.version.get_version)
main_app.router.add_get(f"{subpath}api/changelog", api.http.version.get_changelog)
main_app.router.add_get(f"{subpath}api/notifications", api.http.notifications.collect)

if "dev" in sys.argv:
    main_app.router.add_route("*", "/{tail:.*}", root_dev)
else:
    main_app.router.add_route("*", "/{tail:.*}", root)

# ADMIN ROUTES

api_app.router.add_post(f"{subpath}api/notifications", api.http.notifications.create)
api_app.router.add_get(f"{subpath}api/notifications", api.http.notifications.collect)
api_app.router.add_delete(
    f"{subpath}api/notifications/{{uuid}}", api.http.notifications.delete
)
