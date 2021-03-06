"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

# Check for existence of './templates/' as it is not present if client was not built before
import os
import sys
from utils import FILE_DIR

if (not (FILE_DIR / "templates").exists()) and ("dev" not in sys.argv):
    print(
        "You must gather your par— you must build the client, before starting the server.\nSee https://www.planarally.io/server/setup/self-hosting/ on how to build the client or import a pre-built client."
    )
    sys.exit(1)

# Mimetype recognition for js files apparently is not always properly setup out of the box for some users out there.
import mimetypes

mimetypes.init()
mimetypes.types_map[".js"] = "application/javascript; charset=utf-8"

import save

save.check_save()

import asyncio
import configparser

from aiohttp import web

import api.http
import routes
from state.asset import asset_state
from state.game import game_state

# Force loading of socketio routes
from api.socket import *
from api.socket.constants import GAME_NS
from app import api_app, app as main_app, runners, setup_runner, sio
from config import config
from utils import logger

loop = asyncio.get_event_loop()

# This is a fix for asyncio problems on windows that make it impossible to do ctrl+c
if sys.platform.startswith("win"):

    def _wakeup():
        loop.call_later(0.1, _wakeup)

    loop.call_later(0.1, _wakeup)


async def on_shutdown(_):
    for sid in [*game_state._sid_map.keys(), *asset_state._sid_map.keys()]:
        await sio.disconnect(sid, namespace=GAME_NS)


async def start_http(app: web.Application, host, port):
    logger.warning(" RUNNING IN NON SSL CONTEXT ")
    await setup_runner(app, web.TCPSite, host=host, port=port)


async def start_https(app: web.Application, host, port, chain, key):
    import ssl

    ctx = ssl.SSLContext()
    try:
        ctx.load_cert_chain(chain, key)
    except FileNotFoundError:
        logger.critical("SSL FILES ARE NOT FOUND. ABORTING LAUNCH.")
        sys.exit(2)

    await setup_runner(
        app, web.TCPSite, host=host, port=port, ssl_context=ctx,
    )


async def start_socket(app: web.Application, sock):
    await setup_runner(app, web.UnixSite, path=sock)


async def start_server(server_section: str):
    socket = config.get(server_section, "socket", fallback=None)
    app = main_app
    method = "unknown"
    if server_section == "APIserver":
        app = api_app

    if socket:
        await start_socket(app, socket)
        method = socket
    else:
        host = config.get(server_section, "host")
        port = config.getint(server_section, "port")

        environ = os.environ.get("PA_BASEPATH", "/")

        if config.getboolean(server_section, "ssl"):
            try:
                chain = config.get(server_section, "ssl_fullchain")
                key = config.get(server_section, "ssl_privkey")
            except configparser.NoOptionError:
                logger.critical(
                    "SSL CONFIGURATION IS NOT CORRECTLY CONFIGURED. ABORTING LAUNCH."
                )
                sys.exit(2)

            await start_https(app, host, port, chain, key)
            method = f"https://{host}:{port}{environ}"
        else:
            await start_http(app, host, port)
            method = f"http://{host}:{port}{environ}"

    print(f"======== Starting {server_section} on {method} ========")


async def start_servers():
    print()
    await start_server("Webserver")
    print()
    await start_server("APIserver")
    print()
    print("(Press CTRL+C to quit)")
    print()


main_app.on_shutdown.append(on_shutdown)


if __name__ == "__main__":
    loop.create_task(start_servers())

    try:
        loop.run_forever()
    except:
        pass
    finally:
        for runner in runners:
            loop.run_until_complete(runner.cleanup())
