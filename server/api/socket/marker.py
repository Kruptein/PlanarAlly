import auth
from app import app, logger, sio, state
from models import Marker
from models.db import db


@sio.on("Marker.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_marker(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    location = sid_data["location"]

    marker = Marker.get_or_none(shape=data, user=user)

    if marker is not None:
        return

    Marker.create(
        shape=data,
        user=user,
        location=location
    )

@sio.on("Marker.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_marker(sid, uuid):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    location = sid_data["location"]

    marker = Marker.get_or_none(shape_id=uuid)
    if not marker:
        return

    marker.delete_instance()
