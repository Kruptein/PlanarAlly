import os
from typing import Callable, Iterable, List, Type

import aiohttp_security
import aiohttp_session
from aiohttp import web
from aiohttp_security import SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

from . import auth
from .config import config
from .json import PydanticJson
from .logs import handle_async_exception
from .typed import TypedAsyncServer

runners: List[web.AppRunner] = []


def setup_app(middlewares: Iterable[Callable] = ()) -> web.Application:
    # We add 1 due to a bug in aiohttp uses >= instead of >. This has been fixed on master
    # but is not part of any release
    max_size = config.getint("Webserver", "max_upload_size_in_bytes") + 1
    app = web.Application(middlewares=middlewares, client_max_size=max_size)
    app["AuthzPolicy"] = auth.AuthPolicy()
    aiohttp_security.setup(app, SessionIdentityPolicy(), app["AuthzPolicy"])
    aiohttp_session.setup(app, EncryptedCookieStorage(auth.get_secret_token()))
    return app


async def setup_runner(app: web.Application, site: Type[web.BaseSite], **kwargs):
    runner = web.AppRunner(app)
    runners.append(runner)
    await runner.setup()
    s = site(runner, **kwargs)
    app.loop.set_exception_handler(handle_async_exception)
    await s.start()


# MAIN APP

sio = TypedAsyncServer(
    cors_allowed_origins=config.get("Webserver", "cors_allowed_origins", fallback=None),
    json=PydanticJson,
)
app = setup_app()
basepath = os.environ.get("PA_BASEPATH", "/")[1:]
socketio_path = basepath + "socket.io"
sio.attach(app, socketio_path=socketio_path)
app["state"] = {}

# API APP
admin_app = web.Application()
api_app = setup_app([auth.token_middleware])
