import logging
import os
import sys
from typing import Dict, Union

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
from models import PlayerRoom, User
from utils import FILE_DIR

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

# SETUP PATHS
os.chdir(FILE_DIR)

# SETUP LOGGING

logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(str(FILE_DIR / "planarallyserver.log"))
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
)
file_handler.setFormatter(formatter)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

app["state"] = {}
