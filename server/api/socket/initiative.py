from operator import itemgetter
from peewee import JOIN
from playhouse.shortcuts import dict_to_model, update_model_from_dict

import auth
from app import app, logger, sio, state
from models import (
    Initiative,
    InitiativeEffect,
    InitiativeLocationData,
    Layer,
    Shape,
    ShapeOwner,
)
from models.db import db
from models.utils import reduce_data_to_model


@sio.on("Initiative.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    shape = Shape.get_or_none(uuid=data["uuid"])
    owner = ShapeOwner.get_or_none(shape=shape, user=user) is not None

    if room.creator != user and not owner:
        logger.warning(
            f"{user.name} attempted to change initiative of an asset it does not own"
        )
        return

    used_to_be_visible = False

    location_data = InitiativeLocationData.get_or_none(location=location)
    if location_data is None:
        location_data = InitiativeLocationData.create(
            location=location, turn=data["uuid"], round=1
        )
    initiatives = Initiative.select().where(Initiative.location_data == location_data)

    initiative = Initiative.get_or_none(uuid=data["uuid"])

    # Create new initiative
    if initiative is None:
        with db.atomic():
            # Update indices
            try:
                index = (
                    initiatives.where(Initiative.initiative >= data["initiative"])
                    .order_by(-Initiative.index)[0]
                    .index
                    + 1
                )
            except IndexError:
                index = 0
            else:
                Initiative.update(index=Initiative.index + 1).where(
                    (Initiative.location_data == location_data)
                    & (Initiative.index >= index)
                )
            # Create model instance
            initiative = dict_to_model(
                Initiative, reduce_data_to_model(Initiative, data)
            )
            initiative.location_data = location_data
            initiative.index = index
            initiative.save(force_insert=True)
    # Remove initiative
    elif "initiative" not in data:
        with db.atomic():
            Initiative.update(index=Initiative.index - 1).where(
                (Initiative.location_data == location_data)
                & (Initiative.index >= initiative.index)
            )
            initiative.delete_instance(True)
    # Update initiative
    else:
        used_to_be_visible = initiative.visible

        with db.atomic():
            if data["initiative"] != initiative.initiative:
                # Update indices
                old_index = initiative.index
                try:
                    new_index = (
                        initiatives.where(Initiative.initiative >= data["initiative"])
                        .order_by(-Initiative.index)[0]
                        .index
                    )
                except IndexError:
                    new_index = 0
                else:
                    if new_index < old_index:
                        new_index += 1
                if old_index != new_index:
                    # SIGN=1 IF old_index > new_index WHICH MEANS the initiative is increased
                    # SIGN=-1 IF old_index < new_index WHICH MEANS the initiative is decreased
                    sign = (old_index - new_index) // abs(old_index - new_index)
                    indices = [0, old_index, new_index]
                    update = Initiative.update(index=Initiative.index + sign).where(
                        (Initiative.location_data == location_data)
                        & (Initiative.index <= indices[sign])
                        & (Initiative.index >= indices[-sign])
                    )
                    update.execute()
                data["index"] = new_index
            # Update model instance
            update_model_from_dict(initiative, reduce_data_to_model(Initiative, data))
            initiative.save()

    data["index"] = initiative.index

    await send_client_initiatives(room, location)


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

    location_data = InitiativeLocationData.get(location=location)

    with db.atomic():
        for i, uuid in enumerate(data):
            init = Initiative.get(uuid=uuid)
            init.index = i
            init.save()

    await send_client_initiatives(room, location)


@sio.on("Initiative.Turn.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_turn(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to advance the initiative tracker")
        return

    location_data = InitiativeLocationData.get(location=location)
    with db.atomic():
        location_data.turn = data
        location_data.save()

        effects = (
            InitiativeEffect.select().join(Initiative).where(Initiative.uuid == data)
        )
        for effect in effects:
            if effect.turns <= 0:
                effect.delete_instance()
            else:
                effect.turns -= 1
            effect.save()

    await sio.emit(
        "Initiative.Turn.Update",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Round.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_round(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to advance the initiative tracker")
        return

    location_data = InitiativeLocationData.get(location=location)
    with db.atomic():
        location_data.round = data
        location_data.save()

    await sio.emit(
        "Initiative.Round.Update",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Effect.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_initiative_effect(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user and not ShapeOwner.get_or_none(shape=data["actor"], user=user):
        logger.warning(f"{user.name} attempted to create a new initiative effect")
        return

    InitiativeEffect.create(
        initiative=data["actor"],
        uuid=data["effect"]["uuid"],
        name=data["effect"]["name"],
        turns=data["effect"]["turns"],
    )

    await sio.emit(
        "Initiative.Effect.New",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Initiative.Effect.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_initiative_effect(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]
    
    if room.creator != user and not ShapeOwner.get_or_none(shape=data["actor"], user=user):
        logger.warning(f"{user.name} attempted to update an initiative effect")
        return
    
    print(data)

    with db.atomic():
        effect = InitiativeEffect.get(uuid=data["effect"]["uuid"])
        update_model_from_dict(
            effect, reduce_data_to_model(InitiativeEffect, data["effect"])
        )
        effect.save()

    await sio.emit(
        "Initiative.Effect.Update",
        data,
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


def get_client_initiatives(user, location):
    location_data = InitiativeLocationData.get_or_none(location=location)
    if location_data is None:
        return []
    initiatives = Initiative.select().where(Initiative.location_data == location_data)
    if location.room.creator != user:
        initiatives = (
            initiatives.join(
                ShapeOwner, JOIN.LEFT_OUTER, on=Initiative.uuid == ShapeOwner.shape
            )
            .where((Initiative.visible == True) | (ShapeOwner.user == user))
            .distinct()
        )
    return [i.as_dict() for i in initiatives.order_by(Initiative.index)]


async def send_client_initiatives(room, location, user=None, skip_sid=None):
    for room_player in room.players:
        if user is None or user == room_player.player:
            for psid in state.get_sids(user=room_player.player, room=room):
                if psid == skip_sid:
                    continue
                await sio.emit(
                    "Initiative.Set",
                    get_client_initiatives(room_player.player, location),
                    room=psid,
                    namespace="/planarally",
                )

    if user is None or user == room.creator:
        for csid in state.get_sids(user=room.creator, room=room):
            if csid == skip_sid:
                continue
            await sio.emit(
                "Initiative.Set",
                get_client_initiatives(room.creator, location),
                room=csid,
                namespace="/planarally",
            )
