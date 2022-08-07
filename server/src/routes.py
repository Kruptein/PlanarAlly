from functools import partial
import os
import sys

import aiohttp
from aiohttp import web

from .api import http
from .api.http.admin import campaigns
from .api.http.admin import users as admin_users
from .api.http import auth
from .api.http import notifications
from .api.http import rooms
from .api.http import server
from .api.http import users
from .api.http import version
from .app import admin_app, api_app, app as main_app
from .config import config
from .utils import ASSETS_DIR, FILE_DIR, STATIC_DIR


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

main_app.router.add_static(f"{subpath}/static/assets", ASSETS_DIR)
main_app.router.add_static(f"{subpath}/static", STATIC_DIR)
main_app.router.add_get(f"{subpath}/api/auth", auth.is_authed)
main_app.router.add_post(f"{subpath}/api/users/email", users.set_email)
main_app.router.add_post(f"{subpath}/api/users/password", users.set_password)
main_app.router.add_post(f"{subpath}/api/users/delete", users.delete_account)
main_app.router.add_post(f"{subpath}/api/login", auth.login)
main_app.router.add_post(f"{subpath}/api/register", auth.register)
main_app.router.add_post(f"{subpath}/api/logout", auth.logout)
main_app.router.add_get(f"{subpath}/api/server/upload_limit", server.get_limit)
main_app.router.add_get(f"{subpath}/api/rooms", rooms.get_list)
main_app.router.add_post(f"{subpath}/api/rooms", rooms.create)
main_app.router.add_patch(f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.patch)
main_app.router.add_delete(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.delete
)
main_app.router.add_get(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", rooms.get_info
)
main_app.router.add_patch(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", rooms.set_info
)
main_app.router.add_get(
    f"{subpath}/api/rooms/{{creator}}/{{roomname}}/export", rooms.export
)
main_app.router.add_get(f"{subpath}/api/rooms/{{creator}}/export", rooms.export_all)
main_app.router.add_post(f"{subpath}/api/rooms/import/{{name}}", rooms.import_info)
main_app.router.add_post(
    f"{subpath}/api/rooms/import/{{name}}/{{chunk}}", rooms.import_chunk
)
main_app.router.add_post(f"{subpath}/api/invite", http.claim_invite)
main_app.router.add_get(f"{subpath}/api/version", version.get_version)
main_app.router.add_get(f"{subpath}/api/changelog", version.get_changelog)
main_app.router.add_get(f"{subpath}/api/notifications", notifications.collect)

# ADMIN ROUTES

api_app.router.add_post(f"{subpath}/notifications", notifications.create)
api_app.router.add_get(f"{subpath}/notifications", notifications.collect)
api_app.router.add_delete(f"{subpath}/notifications/{{uuid}}", notifications.delete)
api_app.router.add_get(f"{subpath}/users", admin_users.collect)
api_app.router.add_post(f"{subpath}/users/reset", admin_users.reset)
api_app.router.add_post(f"{subpath}/users/remove", admin_users.remove)
api_app.router.add_get(f"{subpath}/campaigns", campaigns.collect)

admin_app.router.add_static(f"{subpath}/static", STATIC_DIR)
admin_app.add_subapp("/api/", api_app)

TAIL_REGEX = "/{tail:.*}"
if "dev" in sys.argv:
    main_app.router.add_route("*", TAIL_REGEX, root_dev)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root_dev, admin_api=True))
else:
    main_app.router.add_route("*", TAIL_REGEX, root)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root, admin_api=True))
