from typing import Any

import pydantic

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.general_data_block import GeneralDataBlock
from ...db.models.shape_data_block import ShapeDataBlock
from ...logs import logger
from ...transform.from_api.data_block import get_data_block
from ..models.data_block import (
    ApiCoreDataBlock,
    ApiDataBlock,
    ApiGeneralDataBlock,
    ApiShapeDataBlock,
)

db_mapper = {
    "general": {"api": ApiGeneralDataBlock, "db": GeneralDataBlock},
    "shape": {"api": ApiShapeDataBlock, "db": ShapeDataBlock},
}


def get_api_block(data: ApiCoreDataBlock) -> ApiDataBlock:
    return db_mapper[data.category]["api"](**data.dict())


@sio.on("DataBlock.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def load_datablock(_sid: str, raw_data: Any):
    try:
        data = pydantic.parse_obj_as(ApiDataBlock, {"data": "", **raw_data})
    except pydantic.error_wrappers.ValidationError as e:
        logger.exception(e)
        return

    if data_block := get_data_block(data):
        return data_block.as_pydantic()
    return None


@sio.on("DataBlock.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_datablock(_sid: str, raw_data: Any):
    try:
        data = pydantic.parse_obj_as(ApiDataBlock, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return False

    try:
        db_data = data.dict()
        del db_data["category"]
        db_mapper[data.category]["db"].create(**db_data)
    except Exception as e:
        logger.error(e)
        return False
    logger.debug("!!CREATED A NEW DATABLOCK!!")
    return True


@sio.on("DataBlock.Save", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def save_datablock(_sid: str, raw_data: Any):
    try:
        data = pydantic.parse_obj_as(ApiDataBlock, raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return

    if data_block := get_data_block(data):
        data_block.data = data.data
        data_block.save()
