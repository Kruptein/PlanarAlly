from typing import Any

from pydantic import TypeAdapter

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.character import Character
from ...db.models.player_room import PlayerRoom
from ...db.models.room import Room
from ...db.models.room_data_block import RoomDataBlock
from ...db.models.shape import Shape
from ...db.models.shape_data_block import ShapeDataBlock
from ...db.models.user_data_block import UserDataBlock
from ...logs import logger
from ...models.access import has_ownership
from ...state.game import game_state
from ...transform.from_api.data_block import get_data_block
from ..helpers import _send_game
from ..models.data_block import ApiDataBlock, ApiRoomDataBlock, ApiShapeDataBlock, ApiUserDataBlock

db_mapper = {
    "room": {"api": ApiRoomDataBlock, "db": RoomDataBlock},
    "shape": {"api": ApiShapeDataBlock, "db": ShapeDataBlock},
    "user": {"api": ApiUserDataBlock, "db": UserDataBlock},
}


def _get_shape_room(shape: Shape) -> Room | None:
    if shape.layer is not None:
        return shape.layer.floor.location.room
    # Shapes without a layer are characters that are not placed on any map
    if character := Character.get_or_none(shape=shape):
        return character.campaign
    return None


def _has_access(data: ApiDataBlock, pr: PlayerRoom, *, edit: bool) -> bool:
    if data.category != "shape":
        return True

    shape = Shape.get_or_none(uuid=data.shape)
    if shape is None:
        return False
    if _get_shape_room(shape) != pr.room:
        return False
    return not edit or has_ownership(shape, pr, edit=True)


def _get_target_sids(data: ApiDataBlock, pr: PlayerRoom, skip_sid: str):
    if data.category == "user":
        # User datablocks are private to the user, but the user can have multiple active sessions
        return game_state.get_sids(player=pr.player, skip_sid=skip_sid)
    return game_state.get_sids(room=pr.room, skip_sid=skip_sid)


@sio.on("DataBlock.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def load_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    data = TypeAdapter(ApiDataBlock).validate_python({"data": "", **raw_data})

    if not _has_access(data, pr, edit=False):
        logger.warning(f"{pr.player.name} attempted to load a DataBlock they have no access to")
        return None

    if data_block := get_data_block(data, pr):
        return data_block.as_pydantic()
    return None


@sio.on("DataBlock.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    data = TypeAdapter(ApiDataBlock).validate_python(raw_data)

    if not _has_access(data, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to create a DataBlock they have no access to")
        return False

    try:
        db_data = data.model_dump()
        del db_data["category"]
        if data.category == "room":
            db_data["room"] = pr.room
        elif data.category == "user":
            db_data["user"] = pr.player

        data_block = db_mapper[data.category]["db"].create(**db_data)
    except Exception as e:
        logger.error(e)
        return False

    for psid in _get_target_sids(data, pr, skip_sid=sid):
        await _send_game("DataBlock.Created", data_block.as_pydantic(), room=psid)

    return True


@sio.on("DataBlock.Save", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def save_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    data = TypeAdapter(ApiDataBlock).validate_python(raw_data)

    if not _has_access(data, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to save a DataBlock they have no access to")
        return

    if data_block := get_data_block(data, pr):
        data_block.data = data.data
        data_block.save()

        for psid in _get_target_sids(data, pr, skip_sid=sid):
            await _send_game("DataBlock.Saved", data, room=psid)
