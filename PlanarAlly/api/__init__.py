import auth
from app import app, logger, sio, state
from models import GridLayer, Layer, LocationUserOption
from models.db import db
from . import asset_manager, connection, initiative, location, note, shape


@sio.on("Client.Options.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_client(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    location = sid_data["location"]

    with db.atomic():
        for option in [
            ("gridColour", "grid_colour"),
            ("fowColour", "fow_colour"),
            ("rulerColour", "ruler_colour"),
        ]:
            if option[0] in data:
                setattr(user, option[1], data[option[0]])
        user.save()
    if "locationOptions" in data:
        LocationUserOption.update(
            pan_x=data["locationOptions"]["panX"],
            pan_y=data["locationOptions"]["panY"],
            zoom_factor=data["locationOptions"]["zoomFactor"],
        ).where(
            (LocationUserOption.location == location)
            & (LocationUserOption.user == user)
        ).execute()


@sio.on("Gridsize.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_gridsize(sid, grid_size):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to set gridsize without DM rights")
        return
    gl = GridLayer[Layer.get(location=location, name="grid")]
    gl.size = grid_size
    gl.save()
    await sio.emit(
        "Gridsize.Set",
        grid_size,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Players.Bring", namespace="/planarally")
@auth.login_required(app, sio)
async def bring_players(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    await sio.emit(
        "Position.Set",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )
