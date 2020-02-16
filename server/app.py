import logging
import os
import sys

import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
import socketio
from aiohttp import web
from aiohttp_security import SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
from utils import FILE_DIR

# SETUP SERVER

sio = socketio.AsyncServer(async_mode="aiohttp", engineio_logger=False)
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


# SETUP STATE
class State:
    def __init__(self):
        self.client_temporaries = {}
        self.pending_file_upload_cache = {}
        self.sid_map = {}

    async def clear_temporaries(self, sid):
        if sid in self.client_temporaries:
            await sio.emit(
                "Temp.Clear", self.client_temporaries[sid], namespace="/planarally"
            )
            del self.client_temporaries[sid]

    def add_sid(self, sid, **options):
        self.sid_map[sid] = options

    async def remove_sid(self, sid):
        await state.clear_temporaries(sid)
        del self.sid_map[sid]

    def get_sids(self, skip_sid=None, **options):
        for sid in dict(self.sid_map):
            if all(
                self.sid_map[sid].get(option, None) == value
                for option, value in options.items()
            ):
                if skip_sid != sid:
                    yield sid

    def get_players(self, **options):
        for sid in dict(self.sid_map):
            if all(
                self.sid_map[sid].get(option, None) == value
                for option, value in options.items()
            ):
                yield sid, self.get_user(sid)

    def get_user(self, sid):
        return self.sid_map[sid]["user"]

    def add_temp(self, sid, uid):
        if sid not in self.client_temporaries:
            self.client_temporaries[sid] = []
        self.client_temporaries[sid].append(uid)

    def remove_temp(self, sid, uid):
        self.client_temporaries[sid].remove(uid)


state = State()
app["state"] = state
