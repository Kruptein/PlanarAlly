import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
import socketio
from aiohttp import web
from aiohttp_security import SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
from config import config

# SETUP SERVER

sio = socketio.AsyncServer(
    async_mode="aiohttp",
    engineio_logger=False,
    cors_allowed_origins=config.get("Webserver", "cors_allowed_origins", fallback=None),
)
app = web.Application()
app["AuthzPolicy"] = auth.AuthPolicy()
aiohttp_security.setup(app, SessionIdentityPolicy(), app["AuthzPolicy"])
aiohttp_session.setup(app, EncryptedCookieStorage(auth.get_secret_token()))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader("templates"))
sio.attach(app)

app["state"] = {}
