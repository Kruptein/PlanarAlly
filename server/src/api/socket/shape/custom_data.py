import json
from typing import Any

import pydantic

from .... import auth
from ....api.helpers import _send_game
from ....api.models.shape.custom_data import ApiShapeCustomData, ApiShapeCustomDataIdentifier
from ....api.socket.constants import GAME_NS
from ....api.socket.shape.utils import get_owner_sids, get_shape_or_none
from ....app import app, sio
from ....db.models.player_room import PlayerRoom
from ....db.models.shape_custom_data import ShapeCustomData
from ....logs import logger
from ....state.game import game_state


@sio.on("Shape.CustomData.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape_custom_data(sid: str, raw_data: Any):
    try:
        data: ApiShapeCustomData = pydantic.parse_obj_as(ApiShapeCustomData, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.exception(e)
        return

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.CustomData.Add")
    if shape is None:
        return

    ShapeCustomData.create(
        shape=shape,
        source=data.source,
        prefix=data.prefix,
        name=data.name,
        kind=data.kind,
        value=json.dumps(data.value),
        description=data.description,
    )

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.CustomData.Add",
            raw_data,
            room=psid,
        )


@sio.on("Shape.CustomData.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shape_custom_data(sid: str, raw_data: Any):
    data = ApiShapeCustomDataIdentifier(**raw_data)
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.CustomData.Remove")
    if shape is None:
        return

    scd = ShapeCustomData.get_or_none(
        shape=shape,
        source=data.source,
        prefix=data.prefix,
        name=data.name,
    )
    if scd is None:
        logger.error(
            f"Attempt to remove unknown shape custom data by {pr.player.name} [{data.shapeId}] [{data.source}] [{data.prefix}] [{data.name}]"
        )
        return

    scd.delete_instance(True)

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.CustomData.Remove",
            raw_data,
            room=psid,
        )


@sio.on("Shape.CustomData.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_custom_data(sid: str, raw_data: Any):
    try:
        data: ApiShapeCustomData = pydantic.parse_obj_as(ApiShapeCustomData, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.exception(e)
        return

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.CustomData.Update")
    if shape is None:
        return

    scd = ShapeCustomData.get_or_none(
        shape=shape,
        source=data.source,
        prefix=data.prefix,
        name=data.name,
    )
    if scd is None:
        logger.error(
            f"Attempt to update unknown shape custom data by {pr.player.name} [{data.shapeId}] [{data.source}] [{data.prefix}] [{data.name}]"
        )
        return

    scd.kind = data.kind
    scd.value = json.dumps(data.value)
    scd.description = data.description
    scd.reference = data.reference
    scd.save()

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.CustomData.Update",
            raw_data,
            room=psid,
        )


@sio.on("Shape.CustomData.Update.Name", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_custom_data_name(sid: str, raw_data: list[Any]):
    if len(raw_data) != 2:
        return

    data = ApiShapeCustomDataIdentifier(**raw_data[0])
    new_name = raw_data[1]

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.CustomData.Update.Name")
    if shape is None:
        return

    scd = ShapeCustomData.get_or_none(
        shape=shape,
        source=data.source,
        prefix=data.prefix,
        name=data.name,
    )
    if scd is None:
        return

    scd.name = new_name
    scd.save()

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.CustomData.Update.Name",
            raw_data,
            room=psid,
        )
