from operator import itemgetter
from peewee import JOIN
from playhouse.shortcuts import dict_to_model, update_model_from_dict

import auth
from app import app, logger, sio, state
from models import Initiative, InitiativeEffect, Layer, Shape, ShapeOwner
from models.utils import reduce_data_to_model


@sio.on("Initiative.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    shape = Shape.get_or_none(uuid=data["uuid"])

    if room.creator != user and not ShapeOwner.get_or_none(shape=shape, user=user):
        logger.warning(
            f"{user.name} attempted to change initiative of an asset it does not own"
        )
        return

    removed = False
    used_to_be_visible = False

    initiative = Initiative.get_or_none(data["uuid"])

    if initiative is None:
        initiative = dict_to_model(Initiative, reduce_data_to_model(Initiative, data))
        initiative.save()
    else:
        if "initiative" not in data:
            removed = True
            initiative.delete_instance(True)
        else:
            used_to_be_visible = initiative.visible
            update_model_from_dict(initiative, reduce_data_to_model(Initiative, data))
            initiative.save()

    # sorted_initiatives = [
    #     init.as_dict()
    #     for init in Initiative.select()
    #     .join(Shape, JOIN.LEFT_OUTER, on=(Initiative.uuid == Shape.uuid))
    #     .join(Layer)
    #     .where((Layer.location == location))
    #     .order_by(Initiative.index)
    # ]

    if removed or used_to_be_visible or data["visible"]:
        for room_player in room.players:
            for psid in state.get_sids(room_player.player, room):
                if psid == sid:
                    continue
                await sio.emit(
                    "Initiative.Update", data, room=psid, namespace="/planarally"
                )

    for csid in state.get_sids(room.creator, room):
        if csid == sid:
            continue
        await sio.emit("Initiative.Update", data, room=csid, namespace="/planarally")


@sio.on("Initiative.Order.Set", namespace="/planarally")
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
