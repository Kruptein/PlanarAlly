from typing import Any

import pydantic

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.room_data_block import RoomDataBlock
from ...db.models.shape_data_block import ShapeDataBlock
from ...db.models.user_data_block import UserDataBlock
from ...logs import logger
from ...state.game import game_state
from ...transform.from_api.data_block import get_data_block
from ..helpers import _send_game
from ..models.data_block import (
    ApiCoreDataBlock,
    ApiDataBlock,
    ApiRoomDataBlock,
    ApiShapeDataBlock,
    ApiUserDataBlock,
)

db_mapper = {
    "room": {"api": ApiRoomDataBlock, "db": RoomDataBlock},
    "shape": {"api": ApiShapeDataBlock, "db": ShapeDataBlock},
    "user": {"api": ApiUserDataBlock, "db": UserDataBlock},
}


def get_api_block(data: ApiCoreDataBlock) -> ApiDataBlock:
    return db_mapper[data.category]["api"](**data.dict())


@sio.on("DataBlock.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def load_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    try:
        data = pydantic.parse_obj_as(ApiDataBlock, {"data": "", **raw_data})
    except pydantic.error_wrappers.ValidationError as e:
        logger.exception(e)
        return

    if data_block := get_data_block(data, pr):
        return data_block.as_pydantic()
    return None


@sio.on("DataBlock.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    try:
        data = pydantic.parse_obj_as(ApiDataBlock, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return False

    try:
        db_data = data.dict()
        del db_data["category"]
        if data.category == "room":
            db_data["room"] = pr.room
        elif data.category == "user":
            db_data["user"] = pr.player

        data_block = db_mapper[data.category]["db"].create(**db_data)
    except Exception as e:
        logger.error(e)
        return False

    await _send_game(
        "DataBlock.Created",
        data_block.as_pydantic(),
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )

    return True


@sio.on("DataBlock.Save", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def save_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    try:
        data = pydantic.parse_obj_as(ApiDataBlock, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return

    if data_block := get_data_block(data, pr):
        data_block.data = data.data
        data_block.save()

        await _send_game(
            "DataBlock.Saved", data, skip_sid=sid, room=pr.active_location.get_path()
        )
