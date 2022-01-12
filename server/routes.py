from functools import partial
import os
import sys

import aiohttp
import aiohttp_jinja2
from aiohttp import web
from aiohttp_security import check_authorized

import api.http
from app import admin_app, api_app, app as main_app
from config import config
from models import Room, User
from models.role import Role
from utils import logger


subpath = os.environ.get("PA_BASEPATH", "/")
if subpath[-1] != "/":
    subpath = subpath + "/"


async def root(request, admin_api=False):
    template = "admin-index.html" if admin_api else "index.html"
    with open(f"./templates/{template}", "rb") as f:
        data = f.read()
        data = data.replace(b"/static", bytes(subpath, "utf-8")[:-1] + b"/static")

        if not config.getboolean("General", "allow_signups"):
            data = data.replace(
                b'name="PA-signup" content="true"', b'name="PA-signup" content="false"'
            )
        return web.Response(body=data, content_type="text/html")


async def root_dev(request, admin_api=False):
    port = 8081 if admin_api else 8080
    target_url = f"http://localhost:{port}{request.rel_url}"
    data = await request.read()
    get_data = request.rel_url.query
    async with aiohttp.ClientSession() as session:
        async with session.request(
            "get", target_url, headers=request.headers, data=data
        ) as response:
            raw = await response.read()
            raw = raw.replace(b"$BASE_PATH$", bytes(subpath, "utf-8")[:-1])
            if not config.getboolean("General", "allow_signups"):
                raw = raw.replace(
                    b'name="PA-signup" content="true"',
                    b'name="PA-signup" content="false"',
                )

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
main_app.router.add_patch(
    f"{subpath}api/rooms/{{creator}}/{{roomname}}", api.http.rooms.patch
)
main_app.router.add_delete(
    f"{subpath}api/rooms/{{creator}}/{{roomname}}", api.http.rooms.delete
)
main_app.router.add_get(
    f"{subpath}api/rooms/{{creator}}/{{roomname}}/info", api.http.rooms.get_info
)
main_app.router.add_patch(
    f"{subpath}api/rooms/{{creator}}/{{roomname}}/info", api.http.rooms.set_info
)
main_app.router.add_get(
    f"{subpath}api/rooms/{{creator}}/{{roomname}}/export", api.http.rooms.export
)
main_app.router.add_post(f"{subpath}api/invite", api.http.claim_invite)
main_app.router.add_get(f"{subpath}api/version", api.http.version.get_version)
main_app.router.add_get(f"{subpath}api/changelog", api.http.version.get_changelog)
main_app.router.add_get(f"{subpath}api/notifications", api.http.notifications.collect)

# ADMIN ROUTES

api_app.router.add_post(f"{subpath}notifications", api.http.notifications.create)
api_app.router.add_get(f"{subpath}notifications", api.http.notifications.collect)
api_app.router.add_delete(
    f"{subpath}notifications/{{uuid}}", api.http.notifications.delete
)
api_app.router.add_get(f"{subpath}users", api.http.admin.users.collect)
api_app.router.add_post(f"{subpath}users/reset", api.http.admin.users.reset)
api_app.router.add_post(f"{subpath}users/remove", api.http.admin.users.remove)
api_app.router.add_get(f"{subpath}campaigns", api.http.admin.campaigns.collect)

admin_app.router.add_static(f"{subpath}static", "static")
admin_app.add_subapp("/api/", api_app)

if "dev" in sys.argv:
    main_app.router.add_route("*", "/{tail:.*}", root_dev)
    admin_app.router.add_route("*", "/{tail:.*}", partial(root_dev, admin_api=True))
else:
    main_app.router.add_route("*", "/{tail:.*}", root)
    admin_app.router.add_route("*", "/{tail:.*}", partial(root, admin_api=True))
