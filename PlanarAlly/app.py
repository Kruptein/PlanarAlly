import logging
import os
import sys
from pathlib import Path

import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
import socketio
from aiohttp import web
from aiohttp_security import SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
from models import Location, Room, User

# SETUP SERVER

sio = socketio.AsyncServer(async_mode="aiohttp", engineio_logger=False)
app = web.Application()
app["AuthzPolicy"] = auth.PA_AuthPolicy()
aiohttp_security.setup(app, SessionIdentityPolicy(), app["AuthzPolicy"])
aiohttp_session.setup(app, EncryptedCookieStorage(auth.get_secret_token()))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader("templates"))
sio.attach(app)

# SETUP PATHS

if getattr(sys, "frozen", False):
    FILE_DIR = Path(sys.executable).resolve().parent
else:
    FILE_DIR = Path(__file__).resolve().parent

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
        location_id = self.sid_map[sid]["location"].id
        if sid in self.client_temporaries.get(location_id, []):
            await sio.emit("Temp.Clear", self.client_temporaries[location_id][sid])
            del self.client_temporaries[location_id][sid]

    def add_sid(self, sid, user, room, location):
        self.sid_map[sid] = {"user": user, "room": room, "location": room}

    async def remove_sid(self, sid):
        await state.clear_temporaries(sid)
        del self.sid_map[sid]

    def get_sids(self, user, room):
        for sid in self.sid_map:
            if "room" not in self.sid_map[sid]:
                logger.error("ROOM NOT IN SID_MAP")
                logger.error(sid)
                logger.error(self.sid_map[sid])
                continue
            if self.sid_map[sid]["user"] == user and self.sid_map[sid]["room"] == room:
                yield sid

    def add_temp(self, sid, uid):
        if sid not in self.client_temporaries:
            self.client_temporaries[sid] = []
        self.client_temporaries[sid].append(uid)

    def remove_temp(self, sid, uid):
        self.client_temporaries[sid].remove(data["shape"]["uuid"])


state = State()
app["state"] = state
