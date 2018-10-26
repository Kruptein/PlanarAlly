from operator import itemgetter

import auth
from app import app, logger, sio


@sio.on("Initiative.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if not hasattr(location, "initiative"):
        location.initiative = []

    shape = location.layer_manager.get_shape(data["uuid"])

    if room.creator != username:
        if username not in shape["owners"]:
            logger.warning(
                f"{username} attempted to change initiative of an asset it does not own"
            )
            return

    removed = False
    used_to_be_visible = False

    for init in list(location.initiative):
        if init["uuid"] == data["uuid"]:
            if "initiative" not in data:
                removed = True
                location.initiative.remove(init)
            else:
                used_to_be_visible = init.get("visible", False)
                init.update(**data)
            break
    else:
        location.initiative.append(data)
    location.initiative.sort(key=itemgetter("initiative"), reverse=True)

    for player in room.players:
        if player == username:
            continue

        if not removed and not used_to_be_visible and not data["visible"]:
            continue

        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            await sio.emit(
                "Initiative.Update", data, room=psid, namespace="/planarally"
            )

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit(
                "Initiative.Update", data, room=croom, namespace="/planarally"
            )


@sio.on("Initiative.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_order(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to change the initiative order")
        return

    location.initiative = [d for d in data if d]
    initiatives = location.initiative
    if room.creator != username:
        initiatives = []
        for i in location.initiative:
            shape = location.layer_manager.get_shape(i["uuid"])
            if shape and username in shape.get("owners", []) or i.get("visible", False):
                initiatives.append(i)
    await sio.emit(
        "Initiative.Set",
        initiatives,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Turn.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_turn(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warning(f"{username} attempted to advance the initiative tracker")
        return

    location.initiativeTurn = data
    for init in location.initiative:
        if init["uuid"] == data:
            for eff in list(init["effects"]):
                if eff["turns"] <= 0:
                    init["effects"].remove(eff)
                else:
                    eff["turns"] -= 1

    await sio.emit(
        "Initiative.Turn.Update",
        data,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Round.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_round(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warning(f"{username} attempted to advance the initiative tracker")
        return

    location.initiativeRound = data

    await sio.emit(
        "Initiative.Round.Update",
        data,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Effect.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_initiative_effect(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)

    shape = location.layer_manager.get_shape(data["actor"])

    if room.creator != username:
        if username not in shape["owners"]:
            logger.warning(f"{username} attempted to create a new initiative effect")
            return

    for init in location.initiative:
        if init["uuid"] == data["actor"]:
            if "effects" not in init:
                init["effects"] = []
            init["effects"].append(data["effect"])

    await sio.emit(
        "Initiative.Effect.New",
        data,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Effect.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_effect(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)

    shape = location.layer_manager.get_shape(data["actor"])

    if room.creator != username:
        if username not in shape["owners"]:
            logger.warning(f"{username} attempted to update an initiative effect")
            return

    for init in location.initiative:
        if init["uuid"] == data["actor"]:
            for i, eff in enumerate(init["effects"]):
                if eff["uuid"] == data["effect"]["uuid"]:
                    init["effects"][i] = data["effect"]

    await sio.emit(
        "Initiative.Effect.Update",
        data,
        room=location.sioroom,
        skip_sid=sid,
        namespace="/planarally",
    )

