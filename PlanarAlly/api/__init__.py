import auth
from app import sio, app, logger, state
from models import LocationUserOption, db
from . import asset_manager, connection, initiative, note, location, shape


@sio.on("Client.Options.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_client(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    print(data)

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
    username = app["AuthzPolicy"].sid_map[sid]["user"].name
    room = app["AuthzPolicy"].sid_map[sid]["room"]
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warning(f"{username} attempted to set gridsize without DM rights")
        return
    location.layer_manager.get_grid_layer().size = grid_size
    await sio.emit(
        "Gridsize.Set",
        grid_size,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Players.Bring", namespace="/planarally")
@auth.login_required(app, sio)
async def bring_players(sid, data):
    policy = app["AuthzPolicy"]
    room = policy.sid_map[sid]["room"]
    for player in room.players:
        user = policy.user_map[player]
        await sio.emit(
            "Position.Set",
            data,
            room=policy.get_sid(user, room),
            namespace="/planarally",
        )
