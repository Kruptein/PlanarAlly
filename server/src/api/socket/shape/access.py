from typing import Any

from .... import auth
from ....app import app, sio
from ....db.models.player_room import PlayerRoom
from ....db.models.shape import Shape
from ....db.models.shape_owner import ShapeOwner
from ....db.models.user import User
from ....logs import logger
from ....models.access import has_ownership
from ....models.role import Role
from ....state.game import game_state
from ....transform.to_api.shape import transform_shape
from ...helpers import _send_game
from ...models.shape import ApiShapeWithLayerInfo
from ...models.shape.owner import (
    ApiDefaultShapeOwner,
    ApiDeleteShapeOwner,
    ApiShapeOwner,
)
from ..constants import GAME_NS


@sio.on("Shape.Owner.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape_owner(sid: str, raw_data: Any):
    data = ApiShapeOwner(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        shape = Shape.get(uuid=data.shape)
    except Shape.DoesNotExist as exc:
        logger.warning(f"Attempt to add owner to unknown shape by {pr.player.name} [{data.shape}]")
        raise exc

    if not has_ownership(shape, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to change asset ownership of a shape it does not own")
        return

    target_user = User.by_name(data.user)
    if target_user is None:
        logger.warning(f"Attempt to add unknown user as owner to shape by {pr.player.name} [{data.user}]")
        return

    # Adding the DM as user is redundant and can only lead to confusion
    if PlayerRoom.get(room=pr.room, player=target_user).role == Role.DM:
        return

    if not ShapeOwner.get_or_none(shape=shape, user=target_user):
        ShapeOwner.create(
            shape=shape,
            user=target_user,
            edit_access=data.edit_access,
            movement_access=data.movement_access,
            vision_access=data.vision_access,
        )
    await _send_game("Shape.Owner.Add", data, room=pr.active_location.get_path(), skip_sid=sid)
    layer = shape.layer
    if layer and not (shape.default_vision_access or shape.default_edit_access):
        for sid, tpr in game_state.get_t(player=target_user, active_location=pr.active_location):
            await _send_game(
                "Shape.Set",
                ApiShapeWithLayerInfo(
                    shape=transform_shape(shape, tpr),
                    floor=layer.floor.name,
                    layer=layer.name,
                ),
                room=sid,
            )


@sio.on("Shape.Owner.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_owner(sid: str, raw_data: Any):
    data = ApiShapeOwner(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        shape = Shape.get(uuid=data.shape)
    except Shape.DoesNotExist as exc:
        logger.warning(f"Attempt to update owner of unknown shape by {pr.player.name} [{data.shape}]")
        raise exc

    if not has_ownership(shape, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to change asset ownership of a shape it does not own")
        return

    target_user = User.by_name(data.user)
    if target_user is None:
        logger.warning(f"Attempt to update unknown user as owner to shape by {pr.player.name} [{data.user}]")
        return

    try:
        so = ShapeOwner.get(shape=shape, user=target_user)
    except ShapeOwner.DoesNotExist:
        logger.warning(f"Attempt to update unknown shape-owner relation by {pr.player.name}")
        return

    so.shape = shape
    so.user = target_user
    so.edit_access = data.edit_access
    so.movement_access = data.movement_access
    so.vision_access = data.vision_access
    so.save()

    await _send_game("Shape.Owner.Update", data, room=pr.active_location.get_path(), skip_sid=sid)

    layer = shape.layer
    if layer is None:
        return

    # Ensure the target player has an updated view of the shape due to access changes
    for tsid, tpr in game_state.get_t(player=target_user, active_location=pr.active_location):
        await _send_game(
            "Shape.Set",
            ApiShapeWithLayerInfo(
                shape=transform_shape(shape, tpr),
                floor=layer.floor.name,
                layer=layer.name,
            ),
            room=tsid,
        )


@sio.on("Shape.Owner.Delete", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_shape_owner(sid: str, raw_data: Any):
    data = ApiDeleteShapeOwner(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        shape = Shape.get(uuid=data.shape)
    except Shape.DoesNotExist as exc:
        logger.warning(f"Attempt to delete owner of unknown shape by {pr.player.name} [{data.shape}]")
        raise exc

    if not has_ownership(shape, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to change asset ownership of a shape it does not own")
        return

    target_user = User.by_name(data.user)
    if target_user is None:
        logger.warning(f"Attempt to delete unknown user as owner to shape by {pr.player.name} [{data.user}]")
        return

    try:
        ShapeOwner.delete().where(
            (ShapeOwner.shape == shape) & (ShapeOwner.user == target_user)  # type: ignore
        ).execute()
    except Exception:
        logger.warning(f"Could not delete shape-owner relation by {pr.player.name}")

    await _send_game("Shape.Owner.Delete", data, room=pr.active_location.get_path(), skip_sid=sid)

    layer = shape.layer
    if layer is None:
        return

    # Ensure the target player has an updated view of the shape due to access changes
    for tsid, tpr in game_state.get_t(player=target_user, active_location=pr.active_location):
        await _send_game(
            "Shape.Set",
            ApiShapeWithLayerInfo(
                shape=transform_shape(shape, tpr),
                floor=layer.floor.name,
                layer=layer.name,
            ),
            room=tsid,
        )


@sio.on("Shape.Owner.Default.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_default_shape_owner(sid: str, raw_data: Any):
    data = ApiDefaultShapeOwner(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        shape: Shape = Shape.get(uuid=data.shape)
    except Shape.DoesNotExist as exc:
        logger.warning(f"Attempt to update owner of unknown shape by {pr.player.name} [{data.shape}]")
        raise exc

    if not has_ownership(shape, pr, edit=True):
        logger.warning(f"{pr.player.name} attempted to change asset ownership of a shape it does not own")
        return

    shape.default_edit_access = data.edit_access
    shape.default_vision_access = data.vision_access
    shape.default_movement_access = data.movement_access

    shape.save()

    layer = shape.layer
    if layer is None:
        return

    # We need to send each player their new view of the shape which includes the default access fields,
    # so there is no use in sending those separately
    for sid, player_room in game_state.get_t(active_location=pr.active_location, skip_sid=sid):
        await _send_game(
            "Shape.Set",
            ApiShapeWithLayerInfo(
                shape=transform_shape(shape, player_room),
                floor=layer.floor.name,
                layer=layer.name,
            ),
            room=sid,
        )
