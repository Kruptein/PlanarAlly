import auth
from app import app, logger, sio, state
from models import Marker
from models.db import db


@sio.on("Marker.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_marker(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]

    marker = Marker.get_or_none(uuid=data)

    if marker is not None:
        return

    Marker.create(
        uuid=data,
        user=user
    )

@sio.on("Marker.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_marker(sid, uuid):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    marker = Marker.get_or_none(uuid=uuid)
    if not marker:
        return

    marker.delete_instance()