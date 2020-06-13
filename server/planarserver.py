"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

# Mimetype recognition for js files apparently is not always properly setup out of the box for some users out there.
import mimetypes

mimetypes.init()
mimetypes.types_map[".js"] = "application/javascript; charset=utf-8"

import save

save.check_save()

import asyncio
import configparser
import sys

from aiohttp import web

import api.http
import routes
from state.asset import asset_state
from state.game import game_state

# Force loading of socketio routes
from api.socket import *
from api.socket.constants import GAME_NS
from app import app, logger, sio
from config import config

# This is a fix for asyncio problems on windows that make it impossible to do ctrl+c
if sys.platform.startswith("win"):

    def _wakeup():
        asyncio.get_event_loop().call_later(0.1, _wakeup)

    asyncio.get_event_loop().call_later(0.1, _wakeup)


async def on_shutdown(_):
    for sid in [*game_state._sid_map.keys(), *asset_state._sid_map.keys()]:
        await sio.disconnect(sid, namespace=GAME_NS)


app.router.add_static("/static", "static")
app.router.add_get("/api/auth", api.http.auth.is_authed)
app.router.add_post("/api/users/email", api.http.users.set_email)
app.router.add_post("/api/users/password", api.http.users.set_password)
app.router.add_post("/api/users/delete", api.http.users.delete_account)
app.router.add_post("/api/login", api.http.auth.login)
app.router.add_post("/api/register", api.http.auth.register)
app.router.add_post("/api/logout", api.http.auth.logout)
app.router.add_get("/api/rooms", api.http.rooms.get_list)
app.router.add_post("/api/rooms", api.http.rooms.create)
app.router.add_post("/api/invite", api.http.claim_invite)
app.router.add_get("/api/version", api.http.version.get_version)
app.router.add_get("/api/changelog", api.http.version.get_changelog)

if "dev" in sys.argv:
    app.router.add_route("*", "/{tail:.*}", routes.root_dev)
else:
    app.router.add_route("*", "/{tail:.*}", routes.root)

app.on_shutdown.append(on_shutdown)


def start_http(host, port):
    logger.warning(" RUNNING IN NON SSL CONTEXT ")
    web.run_app(
        app, host=host, port=config.getint("Webserver", "port"),
    )


def start_https(host, port, chain, key):
    import ssl

    ctx = ssl.SSLContext()
    try:
        ctx.load_cert_chain(chain, key)
    except FileNotFoundError:
        logger.critical("SSL FILES ARE NOT FOUND. ABORTING LAUNCH.")
        sys.exit(2)

    web.run_app(
        app, host=host, port=port, ssl_context=ctx,
    )


def start_socket(sock):
    web.run_app(app, path=sock)


if __name__ == "__main__":
    socket = config.get("Webserver", "socket", fallback=None)
    if socket:
        start_socket(socket)
    else:
        host = config.get("Webserver", "host")
        port = config.getint("Webserver", "port")

        if config.getboolean("Webserver", "ssl"):
            try:
                chain = config.get("Webserver", "ssl_fullchain")
                key = config.get("Webserver", "ssl_privkey")
            except configparser.NoOptionError:
                logger.critical(
                    "SSL CONFIGURATION IS NOT CORRECTLY CONFIGURED. ABORTING LAUNCH."
                )
                sys.exit(2)

            start_https(host, port, chain, key)
        else:
            start_http(host, port)
