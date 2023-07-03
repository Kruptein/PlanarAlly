from typing import Any

import pydantic

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.data_block import DataBlock
from ...logs import logger
from ..models.data_block import ApiDataBlock, ApiDataBlockDescription


@sio.on("DataBlock.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def load_datablock(sid: str, raw_data: Any):
    try:
        data = ApiDataBlockDescription(**raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return

    data_block = DataBlock.get_or_none(source=data.source, name=data.name)
    if data_block is None:
        return None

    return ApiDataBlock(
        source=data_block.source,
        name=data_block.name,
        data=data_block.data,
    )


@sio.on("DataBlock.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_datablock(sid: str, raw_data: Any):
    try:
        data = ApiDataBlock(**raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return False

    try:
        DataBlock.create(source=data.source, name=data.name, data=data.data)
    except Exception as e:
        logger.error(e)
        return False
    return True


@sio.on("DataBlock.Save", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def save_datablock(sid: str, raw_data: Any):
    try:
        data = ApiDataBlock(**raw_data)
    except pydantic.error_wrappers.ValidationError as e:
        logger.error(e)
        return

    data_block = DataBlock.get_or_none(source=data.source, name=data.name)
    if data_block is None:
        return None

    data_block.data = data.data
    data_block.save()
