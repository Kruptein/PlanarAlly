import os
import sys

import aiohttp
from aiohttp import web

from .api import http
from .api.http import auth, mods, notifications, rooms, server, users, version
from .app import app as main_app
from .config import cfg
from .utils import ASSETS_DIR, FILE_DIR, STATIC_DIR

subpath = os.environ.get("PA_BASEPATH", "/")
if subpath[-1] == "/":
    subpath = subpath[:-1]


def __replace_config_data(data: bytes) -> bytes:
    config = cfg()

    if not config.general.allow_signups:
        data = data.replace(b'name="PA-signup" content="true"', b'name="PA-signup" content="false"')
    if not config.mail or not config.mail.enabled:
        data = data.replace(b'name="PA-mail" content="true"', b'name="PA-mail" content="false"')
    return data


async def root(request):
    template = "index.html"
    with open(FILE_DIR / "templates" / template, "rb") as f:
        data = __replace_config_data(f.read())
        return web.Response(body=data, content_type="text/html")


async def root_dev(request):
    port = 8080
    target_url = f"http://localhost:{port}{request.rel_url}"
    data = await request.read()
    async with aiohttp.ClientSession() as client:
        async with client.get(target_url, headers=request.headers, data=data) as response:
            raw = __replace_config_data(await response.read())
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
main_app.router.add_post(f"{subpath}/api/forgot-password", auth.forgot_password)
main_app.router.add_post(f"{subpath}/api/reset-password", auth.reset_password)
main_app.router.add_get(f"{subpath}/api/server/upload_limit", server.get_limit)
main_app.router.add_get(f"{subpath}/api/rooms", rooms.get_list)
main_app.router.add_post(f"{subpath}/api/rooms", rooms.create)
main_app.router.add_patch(f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.patch)
main_app.router.add_delete(f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.delete)
main_app.router.add_patch(f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", rooms.set_info)
main_app.router.add_get(f"{subpath}/api/rooms/{{creator}}/{{roomname}}/export", rooms.export)
main_app.router.add_get(f"{subpath}/api/rooms/{{creator}}/export", rooms.export_all)
main_app.router.add_post(f"{subpath}/api/rooms/import/{{name}}", rooms.import_info)
main_app.router.add_post(f"{subpath}/api/rooms/import/{{name}}/{{chunk}}", rooms.import_chunk)
main_app.router.add_post(f"{subpath}/api/invite", http.claim_invite)
main_app.router.add_get(f"{subpath}/api/version", version.get_version)
main_app.router.add_get(f"{subpath}/api/changelog", version.get_changelog)
main_app.router.add_get(f"{subpath}/api/notifications", notifications.collect)
main_app.router.add_post(f"{subpath}/api/mod/upload", mods.upload)

TAIL_REGEX = "/{tail:(?!api).*}"
if "dev" in sys.argv:
    main_app.router.add_route("*", TAIL_REGEX, root_dev)
else:
    main_app.router.add_route("*", TAIL_REGEX, root)
