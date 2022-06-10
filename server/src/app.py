import os
from typing import Callable, Iterable, List, Type

import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
from aiohttp import web
from aiohttp_security import SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
from config import config
from typed import TypedAsyncServer

runners: List[web.AppRunner] = []


def setup_app(middlewares: Iterable[Callable] = ()) -> web.Application:
    app = web.Application(middlewares=middlewares)
    app["AuthzPolicy"] = auth.AuthPolicy()
    aiohttp_security.setup(app, SessionIdentityPolicy(), app["AuthzPolicy"])
    aiohttp_session.setup(app, EncryptedCookieStorage(auth.get_secret_token()))
    return app


async def setup_runner(app: web.Application, site: Type[web.BaseSite], **kwargs):
    runner = web.AppRunner(app)
    runners.append(runner)
    await runner.setup()
    s = site(runner, **kwargs)
    await s.start()


# MAIN APP

sio = TypedAsyncServer(
    cors_allowed_origins=config.get("Webserver", "cors_allowed_origins", fallback=None)
)
app = setup_app()
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader("templates"))
basepath = os.environ.get("PA_BASEPATH", "/")[1:]
socketio_path = basepath + "socket.io"
sio.attach(app, socketio_path=socketio_path)
app["state"] = {}

# API APP
admin_app = web.Application()
api_app = setup_app([auth.token_middleware])
