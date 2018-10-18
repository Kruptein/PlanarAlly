import auth
from app import app, logger, sio, state
from models import LocationUserOption, Layer


@auth.login_required(app, sio)
async def load_location(sid, location):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]

    sid_data["location"] = location

    data = {}
    data["locations"] = [l.name for l in room.locations]
    data["layers"] = [
        l.as_dict(user, user == room.creator)
        for l in location.layers.order_by(Layer.index).where(Layer.player_visible)
    ]
    client_options = user.as_dict()
    client_options.update(
        **LocationUserOption.get(user=user, location=location).as_dict()
    )

    await sio.emit("Board.Set", data, room=sid, namespace="/planarally")
    await sio.emit(
        "Location.Set", location.as_dict(), room=sid, namespace="/planarally"
    )
    await sio.emit(
        "Client.Options.Set", client_options, room=sid, namespace="/planarally"
    )
    # if hasattr(location, "initiative"):
    #     initiatives = location.initiative
    #     if room.creator != username:
    #         initiatives = []
    #         for i in location.initiative:
    #             shape = location.layer_manager.get_shape(i['uuid'])
    #             if shape and username in shape.get('owners', []) or i.get("visible", False):
    #                 initiatives.append(i)
    #     await sio.emit("Initiative.Set", initiatives, room=sid, namespace='/planarally')
    #     if hasattr(location, "initiativeRound"):
    #         await sio.emit("Initiative.Round.Update", location.initiativeRound, room=sid, namespace='/planarally')
    #     if hasattr(location, "initiativeTurn"):
    #         await sio.emit("Initiative.Turn.Update", location.initiativeTurn, room=sid, namespace='/planarally')


@sio.on("Location.Change", namespace="/planarally")
@auth.login_required(app, sio)
async def change_location(sid, location):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]

    if room.creator != user.name:
        logger.warning(f"{user.name} attempted to change location")
        return

    old_location = room.get_active_location(dm=True)
    sio.leave_room(sid, old_location.get_path(), namespace="/planarally")
    room.dm_location = location
    new_location = room.get_active_location(dm=True)

    sio.enter_room(sid, new_location.get_path(), namespace="/planarally")
    await load_location(sid, new_location)

    room.player_location = location

    for player in room.players:
        for psid in state.get_sids(policy.user_map[player], room):
            sio.leave_room(psid, old_location.get_path(), namespace="/planarally")
            sio.enter_room(psid, new_location.get_path(), namespace="/planarally")
            await load_location(psid, new_location)


@sio.on("Location.Options.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_location_options(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user.name:
        logger.warning(f"{user.name} attempted to set a room option")
        return

    Location.update(**data).where(id=location.id).execute()
    await sio.emit(
        "Location.Options.Set",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Location.New", namespace="/planarally")
@auth.login_required(app, sio)
async def add_new_location(sid, location):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]

    if room.creator != user.name:
        logger.warning(f"{user.name} attempted to add a new location")
        return

    new_location = Location.create(room=room, name=location.name)
    Layer.create(location=new_location, name="map", player_visible=True, index=0)
    Layer.create(
        location=new_location,
        name="grid",
        selectable=False,
        player_visible=True,
        index=1,
    )
    Layer.create(
        location=new_location,
        name="tokens",
        player_visible=True,
        player_editable=True,
        index=2,
    )
    Layer.create(location=new_location, name="dm", index=3)
    Layer.create(location=new_location, name="fow", player_visible=True, index=4)
    Layer.create(
        location=new_location,
        name="fow-players",
        selectable=False,
        player_visible=True,
        index=5,
    )
    Layer.create(
        location=new_location,
        name="draw",
        selectable=False,
        player_visible=True,
        player_editable=True,
        index=6,
    )

    await load_location(sid, location)
