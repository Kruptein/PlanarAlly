from collections.abc import Generator
from typing import Any, cast

from pydantic import TypeAdapter

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.character import Character
from ...db.models.data_block import DataBlock
from ...db.models.player_room import PlayerRoom
from ...db.models.room import Room
from ...db.models.room_data_block import RoomDataBlock
from ...db.models.shape import Shape
from ...db.models.shape_data_block import ShapeDataBlock
from ...db.models.user_data_block import UserDataBlock
from ...logs import logger
from ...models.access import has_ownership
from ...models.role import Role
from ...state.game import game_state
from ...transform.from_api.data_block import get_data_block
from ..helpers import _send_game
from ..models.data_block import (
    ApiDataBlock,
    ApiDataBlockAccess,
    ApiDataBlockCreate,
    ApiDataBlockWithAccess,
    ApiRoomDataBlock,
    ApiShapeDataBlock,
    ApiUserDataBlock,
    DataBlockAccessLevel,
)

db_mapper = {
    "room": {"api": ApiRoomDataBlock, "db": RoomDataBlock},
    "shape": {"api": ApiShapeDataBlock, "db": ShapeDataBlock},
    "user": {"api": ApiUserDataBlock, "db": UserDataBlock},
}

ROOM_ACCESS_LEVELS: set[DataBlockAccessLevel] = {"dm", "room"}


def _get_shape_room(shape: Shape) -> Room | None:
    if shape.layer is not None:
        return cast(Room, shape.layer.floor.location.room)
    # Shapes without a layer are characters that are not placed on any map
    if character := Character.get_or_none(shape=shape):
        return character.campaign
    return None


def _get_scope(data: ApiDataBlock, pr: PlayerRoom) -> tuple[bool, Shape | None]:
    """Returns whether the DataBlock belongs to the active room and the associated shape for shape DataBlocks."""
    if data.category != "shape":
        return True, None

    shape = Shape.get_or_none(uuid=data.shape)
    if shape is None or _get_shape_room(shape) != pr.room:
        return False, None
    return True, shape


def _has_level(level: DataBlockAccessLevel, shape: Shape | None, pr: PlayerRoom) -> bool:
    if pr.role == Role.DM:
        return True
    if level == "dm":
        return False
    if level == "room":
        return True
    if shape is None:
        return False
    return has_ownership(shape, pr, edit=True)


def _get_access(data_block: DataBlock) -> ApiDataBlockAccess | None:
    if isinstance(data_block, ShapeDataBlock | RoomDataBlock):
        return ApiDataBlockAccess.model_validate({"read": data_block.read_access, "write": data_block.write_access})
    return None


def _is_valid_access(data: ApiDataBlock, access: ApiDataBlockAccess | None) -> bool:
    if access is None:
        return True
    if data.category == "user":
        return False
    if data.category == "room":
        return access.read in ROOM_ACCESS_LEVELS and access.write in ROOM_ACCESS_LEVELS
    return True


def _can(access: ApiDataBlockAccess | None, shape: Shape | None, pr: PlayerRoom, *, write: bool) -> bool:
    # User DataBlocks have no access configuration, they are only ever looked up for the requesting user
    if access is None:
        return True
    return _has_level(access.write if write else access.read, shape, pr)


def _get_target_sids(data: ApiDataBlock, pr: PlayerRoom, skip_sid: str) -> Generator[str]:
    if data.category == "user":
        # User datablocks are private to the user, but the user can have multiple active sessions
        return game_state.get_sids(player=pr.player, skip_sid=skip_sid)
    return game_state.get_sids(room=pr.room, skip_sid=skip_sid)


def _get_reader_sids(
    data: ApiDataBlock, access: ApiDataBlockAccess | None, shape: Shape | None, pr: PlayerRoom, skip_sid: str
) -> Generator[str]:
    for psid in _get_target_sids(data, pr, skip_sid):
        if _can(access, shape, game_state.get(psid), write=False):
            yield psid


def _with_empty_data(raw_data: Any) -> Any:
    return {**raw_data, "dataBlock": {"data": "", **raw_data["dataBlock"]}}


@sio.on("DataBlock.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def load_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    data = TypeAdapter(ApiDataBlock).validate_python({"data": "", **raw_data})

    in_scope, shape = _get_scope(data, pr)
    if not in_scope:
        logger.warning(f"{pr.player.name} attempted to load a DataBlock outside of their active room")
        return None

    data_block = get_data_block(data, pr)
    if data_block is None:
        return None

    access = _get_access(data_block)
    if not _can(access, shape, pr, write=False):
        return None

    return ApiDataBlockWithAccess(dataBlock=data_block.as_pydantic(), access=access)


@sio.on("DataBlock.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    payload = ApiDataBlockCreate.model_validate(raw_data)
    data = payload.dataBlock

    if not _is_valid_access(data, payload.access):
        logger.warning(f"{pr.player.name} attempted to create a {data.category} DataBlock with invalid access")
        return False

    in_scope, shape = _get_scope(data, pr)
    if not in_scope:
        logger.warning(f"{pr.player.name} attempted to create a DataBlock outside of their active room")
        return False

    if get_data_block(data, pr) is not None:
        logger.warning(f"{pr.player.name} attempted to create a DataBlock that already exists")
        return False

    try:
        db_data = data.model_dump()
        del db_data["category"]
        if data.category == "room":
            db_data["room"] = pr.room
        elif data.category == "user":
            db_data["user"] = pr.player
        if payload.access is not None:
            db_data["read_access"] = payload.access.read
            db_data["write_access"] = payload.access.write

        data_block = db_mapper[data.category]["db"](**db_data)
        access = _get_access(data_block)
        if not _can(access, shape, pr, write=True):
            logger.warning(f"{pr.player.name} attempted to create a DataBlock they have no write access to")
            return False
        data_block.save(force_insert=True)
    except Exception as e:
        logger.error(e)
        return False

    for psid in _get_reader_sids(data, access, shape, pr, skip_sid=sid):
        await _send_game(
            "DataBlock.Created",
            ApiDataBlockWithAccess(dataBlock=data_block.as_pydantic(), access=access),
            room=psid,
        )

    return True


@sio.on("DataBlock.Save", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def save_datablock(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    data = TypeAdapter(ApiDataBlock).validate_python(raw_data)

    in_scope, shape = _get_scope(data, pr)
    if not in_scope:
        logger.warning(f"{pr.player.name} attempted to save a DataBlock outside of their active room")
        return

    data_block = get_data_block(data, pr)
    if data_block is None:
        return

    access = _get_access(data_block)
    if not _can(access, shape, pr, write=True):
        logger.warning(f"{pr.player.name} attempted to save a DataBlock they have no write access to")
        return

    data_block.data = data.data
    data_block.save()

    for psid in _get_reader_sids(data, access, shape, pr, skip_sid=sid):
        await _send_game("DataBlock.Saved", data, room=psid)


@sio.on("DataBlock.Access.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_datablock_access(sid: str, raw_data: Any):
    pr = game_state.get(sid)

    payload = ApiDataBlockWithAccess.model_validate(_with_empty_data(raw_data))
    data = payload.dataBlock
    new_access = payload.access

    if new_access is None or not _is_valid_access(data, new_access):
        logger.warning(f"{pr.player.name} attempted to set invalid access on a {data.category} DataBlock")
        return False

    in_scope, shape = _get_scope(data, pr)
    if not in_scope:
        logger.warning(f"{pr.player.name} attempted to update a DataBlock outside of their active room")
        return False

    data_block = get_data_block(data, pr)
    if not isinstance(data_block, ShapeDataBlock | RoomDataBlock):
        return False

    old_access = _get_access(data_block)
    # Changing access is only allowed for users that currently have full access,
    # otherwise a user could grant themselves (or others) access to data they're not supposed to see.
    if not (_can(old_access, shape, pr, write=False) and _can(old_access, shape, pr, write=True)):
        logger.warning(f"{pr.player.name} attempted to update access of a DataBlock without full access")
        return False

    data_block.read_access = new_access.read
    data_block.write_access = new_access.write
    data_block.save()

    for psid in _get_target_sids(data, pr, skip_sid=sid):
        ppr = game_state.get(psid)
        if _can(new_access, shape, ppr, write=False):
            await _send_game(
                "DataBlock.Access.Updated",
                ApiDataBlockWithAccess(dataBlock=data_block.as_pydantic(), access=new_access),
                room=psid,
            )
        elif _can(old_access, shape, ppr, write=False):
            await _send_game("DataBlock.Revoked", data_block.as_pydantic().model_dump(exclude={"data"}), room=psid)

    return True
