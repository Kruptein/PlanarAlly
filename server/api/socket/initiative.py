from operator import itemgetter
from typing import Any, Dict

from peewee import JOIN
from playhouse.shortcuts import dict_to_model, update_model_from_dict

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import (
    Initiative,
    InitiativeEffect,
    InitiativeLocationData,
    Layer,
    Location,
    PlayerRoom,
    Room,
    Shape,
    ShapeOwner,
    User,
)
from models.db import db
from models.role import Role
from models.shape.access import has_ownership, has_ownership_temp
from models.utils import reduce_data_to_model
from state.game import game_state


@sio.on("Initiative.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_initiative(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data["uuid"])

    if not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to change initiative of an asset it does not own"
        )
        return

    location_data = InitiativeLocationData.get_or_none(location=pr.active_location)
    if location_data is None:
        location_data = InitiativeLocationData.create(
            location=pr.active_location, turn=data["uuid"], round=1
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
    # Update initiative
    else:
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

    await send_client_initiatives(pr)


@sio.on("Initiative.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_initiative(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data)

    if shape is not None and not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to remove initiative of an asset it does not own"
        )
        return

    initiative = Initiative.get_or_none(uuid=data)
    location_data = InitiativeLocationData.get_or_none(location=pr.active_location)

    if initiative:
        with db.atomic():
            Initiative.update(index=Initiative.index - 1).where(
                (Initiative.location_data == location_data)
                & (Initiative.index >= initiative.index)
            )
            initiative.delete_instance(True)

        await send_client_initiatives(pr)


@sio.on("Initiative.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_initiative_order(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change the initiative order")
        return

    with db.atomic():
        for i, uuid in enumerate(data):
            init = Initiative.get(uuid=uuid)
            init.index = i
            init.save()

    await send_client_initiatives(pr)


@sio.on("Initiative.Turn.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_initiative_turn(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to advance the initiative tracker")
        return

    location_data = InitiativeLocationData.get(location=pr.active_location)
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
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Initiative.Round.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_initiative_round(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to advance the initiative tracker")
        return

    location_data = InitiativeLocationData.get(location=pr.active_location)
    with db.atomic():
        location_data.round = data
        location_data.save()

    await sio.emit(
        "Initiative.Round.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Initiative.Effect.New", namespace=GAME_NS)
@auth.login_required(app, sio)
async def new_initiative_effect(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if not has_ownership(Shape.get_or_none(uuid=data["actor"]), pr):
        logger.warning(f"{pr.player.name} attempted to create a new initiative effect")
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
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Initiative.Effect.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_initiative_effect(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if not has_ownership(Shape.get_or_none(uuid=data["actor"]), pr):
        logger.warning(f"{pr.player.name} attempted to update an initiative effect")
        return

    with db.atomic():
        effect = InitiativeEffect.get(uuid=data["effect"]["uuid"])
        update_model_from_dict(
            effect, reduce_data_to_model(InitiativeEffect, data["effect"])
        )
        effect.save()

    await sio.emit(
        "Initiative.Effect.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


def get_client_initiatives(user: User, location: Location):
    location_data = InitiativeLocationData.get_or_none(location=location)
    if location_data is None:
        return []
    initiatives = Initiative.select().where(Initiative.location_data == location_data)
    if location.room.creator != user:
        initiatives = (
            initiatives.join(
                ShapeOwner, JOIN.LEFT_OUTER, on=Initiative.uuid == ShapeOwner.shape
            )
            .join(Shape, JOIN.LEFT_OUTER, on=Initiative.uuid == Shape.uuid)
            .where(
                (Initiative.visible == True)
                | (Shape.default_edit_access == True)
                | (ShapeOwner.user == user)
            )
            .distinct()
        )
    return [i.as_dict() for i in initiatives.order_by(Initiative.index)]


async def send_client_initiatives(
    pr: PlayerRoom, target_user: User = None, skip_sid=None
) -> None:
    for room_player in pr.room.players:
        if target_user is None or target_user == room_player.player:
            for psid in game_state.get_sids(
                player=room_player.player, active_location=pr.active_location
            ):
                if psid == skip_sid:
                    continue
                await sio.emit(
                    "Initiative.Set",
                    get_client_initiatives(room_player.player, pr.active_location),
                    room=psid,
                    namespace=GAME_NS,
                )
