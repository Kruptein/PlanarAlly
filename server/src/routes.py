from functools import partial
import os
import sys

import aiohttp
from aiohttp import web

import api.http
import api.http.admin.campaigns
import api.http.admin.users
import api.http.auth
import api.http.notifications
import api.http.rooms
import api.http.server
import api.http.users
import api.http.version
from app import admin_app, api_app, app as main_app
from config import config
from utils import FILE_DIR, STATIC_DIR


subpath = os.environ.get("PA_BASEPATH", "/")
if subpath[-1] == "/":
    subpath = subpath[:-1]


async def root(request, admin_api=False):
    template = "admin-index.html" if admin_api else "index.html"
    with open(FILE_DIR / "templates" / template, "rb") as f:
        data = f.read()

        if not config.getboolean("General", "allow_signups"):
            data = data.replace(
                b'name="PA-signup" content="true"', b'name="PA-signup" content="false"'
            )
        return web.Response(body=data, content_type="text/html")


async def root_dev(request, admin_api=False):
    port = 8081 if admin_api else 8080
    target_url = f"http://localhost:{port}{request.rel_url}"
    data = await request.read()
    async with aiohttp.ClientSession() as session:
        async with session.request(
            "get", target_url, headers=request.headers, data=data
        ) as response:
            raw = await response.read()
            if not config.getboolean("General", "allow_signups"):
                raw = raw.replace(
                    b'name="PA-signup" content="true"',
                    b'name="PA-signup" content="false"',
                )

    return web.Response(body=raw, status=response.status, headers=response.headers)


# MAIN ROUTES

main_app.router.add_static(f"{subpath}/static", STATIC_DIR)
main_app.router.add_get(f"{subpath}/api/auth", api.http.auth.is_authed)
main_app.router.add_post(f"{subpath}/api/users/email", api.http.users.set_email)
main_app.router.add_post(f"{subpath}/api/users/password", api.http.users.set_password)
main_app.router.add_post(f"{subpath}/api/users/delete", api.http.users.delete_account)
main_app.router.add_post(f"{subpath}/api/login", api.http.auth.login)
main_app.router.add_post(f"{subpath}/api/register", api.http.auth.register)
main_app.router.add_post(f"{subpath}/api/logout", api.http.auth.logout)
main_app.router.add_get(f"{subpath}/api/server/upload_limit", api.http.server.get_limit)
main_app.router.add_get(f"{subpath}/api/rooms", api.http.rooms.get_list)
main_app.router.add_post(f"{subpath}/api/rooms", api.http.rooms.create)
main_app.router.add_patch(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}", api.http.rooms.patch
)
main_app.router.add_delete(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}", api.http.rooms.delete
)
main_app.router.add_get(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", api.http.rooms.get_info
)
main_app.router.add_patch(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", api.http.rooms.set_info
)
main_app.router.add_get(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/export", api.http.rooms.export
)
main_app.router.add_get(
    f"{subpath}/api/rooms/{{creator}}/export", api.http.rooms.export_all
)
main_app.router.add_post(
    f"{subpath}/api/rooms/import/{{name}}", api.http.rooms.import_info
)
main_app.router.add_post(
    f"{subpath}/api/rooms/import/{{name}}/{{chunk}}", api.http.rooms.import_chunk
)
main_app.router.add_post(f"{subpath}/api/invite", api.http.claim_invite)
main_app.router.add_get(f"{subpath}/api/version", api.http.version.get_version)
main_app.router.add_get(f"{subpath}/api/changelog", api.http.version.get_changelog)
main_app.router.add_get(f"{subpath}/api/notifications", api.http.notifications.collect)

# ADMIN ROUTES

api_app.router.add_post(f"{subpath}/notifications", api.http.notifications.create)
api_app.router.add_get(f"{subpath}/notifications", api.http.notifications.collect)
api_app.router.add_delete(
    f"{subpath}/notifications/{{uuid}}", api.http.notifications.delete
)
api_app.router.add_get(f"{subpath}/users", api.http.admin.users.collect)
api_app.router.add_post(f"{subpath}/users/reset", api.http.admin.users.reset)
api_app.router.add_post(f"{subpath}/users/remove", api.http.admin.users.remove)
api_app.router.add_get(f"{subpath}/campaigns", api.http.admin.campaigns.collect)

admin_app.router.add_static(f"{subpath}/static", STATIC_DIR)
admin_app.add_subapp("/api/", api_app)

TAIL_REGEX = "/{tail:.*}"
if "dev" in sys.argv:
    main_app.router.add_route("*", TAIL_REGEX, root_dev)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root_dev, admin_api=True))
else:
    main_app.router.add_route("*", TAIL_REGEX, root)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root, admin_api=True))
