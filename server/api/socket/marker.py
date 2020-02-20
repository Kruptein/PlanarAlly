import auth
from app import app, logger, sio, state
from models import Marker
from models.db import db


@sio.on("Marker.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_marker(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if Marker.get_or_none(uuid=data["uuid"]):
        #if it's already there, no need to add it twice.
        return

    Marker.create(
        uuid=data["uuid"],
        user=user,
        room=room,
        location=location
    )

@sio.on("Marker.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_marker(sid, uuid):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    marker = Marker.get_or_none(uuid=uuid)
    logger.warning(
        f"{user.name} removed marker with id: '{uuid}'"
    )
    if not marker:
        logger.warning(
            f"{user.name} tried to remove non-existant marker with id: '{uuid}'"
        )
        return

    marker.delete_instance()

