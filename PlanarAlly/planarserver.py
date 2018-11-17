"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import save
save.check_save()

import asyncio
import sys

from aiohttp import web

import routes
from api import *
from app import app, logger, sio, state
from config import config

# This is a fix for asyncio problems on windows that make it impossible to do ctrl+c
if sys.platform.startswith("win"):

    def _wakeup():
        asyncio.get_event_loop().call_later(0.1, _wakeup)

    asyncio.get_event_loop().call_later(0.1, _wakeup)


async def on_shutdown(_):
    for sid in list(state.sid_map.keys()):
        await sio.disconnect(sid, namespace="/planarally")


app.router.add_static("/static", "static")
app.router.add_route("*", "/", routes.test)
# app.router.add_route("*", "/", routes.login)
# app.router.add_get("/rooms", routes.show_rooms)
# app.router.add_get("/rooms/{username}/{roomname}", routes.show_room)
# app.router.add_get("/invite/{code}", routes.claim_invite)
# app.router.add_post("/create_room", routes.create_room)
# app.router.add_get("/assets/", routes.show_assets)
# app.router.add_get("/logout", routes.logout)

app.on_shutdown.append(on_shutdown)

if __name__ == "__main__":
    if config.getboolean("Webserver", "ssl"):
        import ssl

        ctx = ssl.SSLContext()
        ctx.load_cert_chain(
            config.get("Webserver", "ssl_fullchain"), config.get(
                "Webserver", "ssl_privkey")
        )
        web.run_app(app, host=config.get("Webserver", "host"), port=config.getint(
            "Webserver", "port"), ssl_context=ctx)
    else:
        logger.warning(" RUNNING IN NON SSL CONTEXT ")
        web.run_app(app, host=config.get("Webserver", "host"),
                    port=config.getint("Webserver", "port"))
