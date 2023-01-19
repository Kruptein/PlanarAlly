import json
from typing import Any

from .... import auth
from ....app import app, sio
from ....logs import logger
from ....models import Initiative
from ....models.db import db
from ....models.shape import Shape
from ....models.shape.access import has_ownership
from ....state.game import game_state
from ...helpers import _send_game
from ...models.initiative.effect import (
    InitiativeEffectNew,
    InitiativeEffectRemove,
    InitiativeEffectRename,
    InitiativeEffectTurns,
)
from ..constants import GAME_NS


@sio.on("Initiative.Effect.New", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def new_initiative_effect(sid: str, raw_data: Any):
    data = InitiativeEffectNew(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.actor)

    if shape is None:
        logger.warning("Attempt to create initiative effect for an unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(f"{pr.player.name} attempted to create a new initiative effect")
        return

    location_data = Initiative.get(location=pr.active_location)
    with db.atomic():
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            if initiative["shape"] == data.actor:
                initiative["effects"].append(data.effect)

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Effect.New",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Initiative.Effect.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_initiative_effect(sid: str, raw_data: Any):
    data = InitiativeEffectRename(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to rename initiative effect for an unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(f"{pr.player.name} attempted to create a new initiative effect")
        return

    location_data = Initiative.get(location=pr.active_location)
    with db.atomic():
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            if initiative["shape"] == data.shape:
                initiative["effects"][data.index]["name"] = data.name

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Effect.Rename",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Initiative.Effect.Turns", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_initiative_effect_tuns(sid: str, raw_data: Any):
    data = InitiativeEffectTurns(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to modify initiative effect turns for an unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(f"{pr.player.name} attempted to create a new initiative effect")
        return

    location_data = Initiative.get(location=pr.active_location)
    with db.atomic():
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            if initiative["shape"] == data.shape:
                initiative["effects"][data.index]["turns"] = data.turns

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Effect.Turns",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Initiative.Effect.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_initiative_effect(sid: str, raw_data: Any):
    data = InitiativeEffectRemove(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to remove initiative effect for an unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(f"{pr.player.name} attempted to remove an initiative effect")
        return

    location_data = Initiative.get(location=pr.active_location)
    with db.atomic():
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            if initiative["shape"] == data.shape:
                initiative["effects"].pop(data.index)

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Effect.Remove",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )
