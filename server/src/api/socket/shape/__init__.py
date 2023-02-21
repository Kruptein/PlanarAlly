from typing import Any, List, Optional, Union

from peewee import Case

from .... import auth
from ....api.helpers import _send_game
from ....app import app, sio
from ....db.db import db
from ....db.models.asset_rect import AssetRect
from ....db.models.circle import Circle
from ....db.models.circular_token import CircularToken
from ....db.models.floor import Floor
from ....db.models.layer import Layer
from ....db.models.location import Location
from ....db.models.player_room import PlayerRoom
from ....db.models.rect import Rect
from ....db.models.shape import Shape
from ....db.models.text import Text
from ....logs import logger
from ....models.access import has_ownership
from ....models.role import Role
from ....state.game import game_state
from ....transform.shape import transform_shape
from ...common.shapes import create_shape
from ...models.shape import (
    ShapeAdd,
    ShapeAssetImageSet,
    ShapeCircleSizeUpdate,
    ShapeFloorChange,
    ShapeInfo,
    ShapeLayerChange,
    ShapeLocationMove,
    ShapeOrder,
    ShapeRectSizeUpdate,
    ShapeTextSizeUpdate,
    ShapeTextValueSet,
    TemporaryShapes,
)
from ...models.shape.position import ShapePositionUpdate, ShapesPositionUpdateList
from .. import initiative
from ..constants import GAME_NS
from ..groups import remove_group_if_empty
from . import access, options, toggle_composite  # noqa: F401


@sio.on("Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape(sid: str, raw_data: Any):
    data = ShapeAdd(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        floor = pr.active_location.floors.where(Floor.name == data.shape.floor)[0]
        layer = floor.layers.where(Layer.name == data.shape.layer)[0]
    except IndexError:
        return

    if pr.role != Role.DM and not layer.player_editable:
        logger.warning(f"{pr.player.name} attempted to add a shape to a dm layer")
        return

    shape: Shape | None = None

    if data.temporary:
        game_state.add_temp(sid, data.shape.uuid)
    else:
        shape = create_shape(data.shape, layer=layer)
        if shape is None:
            return

    for room_player in pr.room.players:
        is_dm = room_player.role == Role.DM
        for psid in game_state.get_sids(
            player=room_player.player, active_location=pr.active_location
        ):
            if psid == sid:
                continue
            if not is_dm and not layer.player_visible:
                continue
            if not data.temporary and shape is not None:
                data.shape = transform_shape(shape, room_player.player, is_dm)
            await _send_game("Shape.Add", data.shape, room=psid)


@sio.on("Shapes.Position.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_positions(sid: str, raw_data: Any):
    data = ShapesPositionUpdateList(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shapes: list[tuple[Shape, ShapePositionUpdate]] = []

    for sh in data.shapes:
        shape = Shape.get_or_none(Shape.uuid == sh.uuid)
        if shape is not None and not has_ownership(shape, pr, movement=True):
            logger.warning(
                f"User {pr.player.name} attempted to move a shape it does not own."
            )
            return
        shapes.append((shape, sh))

    if not data.temporary:
        with db.atomic():
            for db_shape, data_shape in shapes:
                points = data_shape.position.points
                db_shape.x = points[0][0]
                db_shape.y = points[0][1]
                db_shape.angle = data_shape.position.angle
                db_shape.save()

                if len(points) > 1:
                    # Subshape
                    type_instance = db_shape.subtype
                    type_instance.set_location(points[1:])

    await _send_game(
        "Shapes.Position.Update",
        data.shapes,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


async def send_remove_shapes(
    data: list[str], *, room: str, skip_sid: Optional[str] = None
):
    await _send_game("Shapes.Remove", data, room=room, skip_sid=skip_sid)


@sio.on("Shapes.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shapes(sid: str, raw_data: Any):
    data = TemporaryShapes(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if data.temporary:
        # This stuff is not stored so we cannot do any server side validation /shrug
        for shape in data.uuids:
            game_state.remove_temp(sid, shape)
    else:
        # Use the server version of the shapes.
        try:
            shapes: List[Shape] = [
                s for s in Shape.select().where(Shape.uuid << data.uuids)  # type: ignore
            ]
        except Shape.DoesNotExist:
            logger.warning(f"Attempt to remove unknown shape by {pr.player.name}")
            return

        layer = shapes[0].layer

        group_ids = set()

        for shape in shapes:
            if not has_ownership(shape, pr):
                logger.warning(
                    f"User {pr.player.name} tried to remove a shape it does not own."
                )
                return

            await initiative.remove_shape(pr, shape.uuid, shape.group)

            if shape.group:
                group_ids.add(shape.group)

            old_index = shape.index
            shape.delete_instance(True)
            Shape.update(index=Shape.index - 1).where(
                (Shape.layer == layer) & (Shape.index >= old_index)
            ).execute()

        for group_id in group_ids:
            await remove_group_if_empty(group_id)

    await send_remove_shapes(
        data.uuids, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shapes.Floor.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_shape_floor(sid: str, raw_data: Any):
    data = ShapeFloorChange(**raw_data)
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the floor of a shape")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data.floor)
    shapes = [s for s in Shape.select().where(Shape.uuid << data.uuids)]  # type: ignore
    layer: Layer = Layer.get(floor=floor, name=shapes[0].layer.name)
    old_layer = shapes[0].layer

    for shape in shapes:
        old_index = shape.index
        shape.layer = layer
        shape.index = layer.shapes.count()
        shape.save()

        Shape.update(index=Shape.index - 1).where(
            (Shape.layer == old_layer) & (Shape.index >= old_index)
        ).execute()

    await _send_game(
        "Shapes.Floor.Change", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shapes.Layer.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_shape_layer(sid: str, raw_data: Any):
    data = ShapeLayerChange(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the layer of a shape")
        return

    floor = Floor.get(location=pr.active_location, name=data.floor)
    shapes = [s for s in Shape.select().where(Shape.uuid << data.uuids)]  # type: ignore
    layer = Layer.get(floor=floor, name=data.layer)
    old_layer = shapes[0].layer

    if old_layer.player_visible and not layer.player_visible:
        for room_player in pr.room.players:
            if room_player.role == Role.DM:
                continue
            for psid in game_state.get_sids(
                player=room_player.player,
                active_location=pr.active_location,
                skip_sid=sid,
            ):
                await send_remove_shapes(data.uuids, room=psid)

    for shape in shapes:
        old_index = shape.index

        shape.layer = layer
        shape.index = layer.shapes.count()
        shape.save()
        Shape.update(index=Shape.index - 1).where(
            (Shape.layer == old_layer) & (Shape.index >= old_index)
        ).execute()

    if old_layer.player_visible and layer.player_visible:
        await _send_game(
            "Shapes.Layer.Change",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
        )
    else:
        for room_player in pr.room.players:
            is_dm = room_player.role == Role.DM
            for psid in game_state.get_sids(
                player=room_player.player,
                active_location=pr.active_location,
                skip_sid=sid,
            ):
                if is_dm:
                    await _send_game(
                        "Shapes.Layer.Change", data, room=psid, skip_sid=sid
                    )
                elif layer.player_visible:
                    await _send_game(
                        "Shapes.Add",
                        [
                            transform_shape(shape, room_player.player, False)
                            for shape in shapes
                        ],
                        room=psid,
                    )
                    await initiative.check_initiative([s.uuid for s in shapes], pr)


@sio.on("Shape.Order.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_shape_order(sid: str, raw_data: Any):
    data = ShapeOrder(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape = Shape.get(uuid=data.uuid)
        layer = shape.layer

        if pr.role != Role.DM and not layer.player_editable:
            logger.warning(
                f"{pr.player.name} attempted to move a shape order on a dm layer"
            )
            return

        target = data.index
        sign = 1 if target < shape.index else -1
        case = Case(
            None,
            (
                (Shape.index == shape.index, target),
                (
                    (sign * Shape.index) < (sign * shape.index),
                    (Shape.index + (sign * 1)),
                ),
            ),
            Shape.index,
        )
        Shape.update(index=case).where(Shape.layer == layer).execute()

    await _send_game(
        "Shape.Order.Set", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shapes.Location.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_shapes(sid: str, raw_data: Any):
    data = ShapeLocationMove(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM and not data.tp_zone:
        logger.warning(f"{pr.player.name} attempted to move shape locations")
        return

    location = Location.get_by_id(data.target.location)
    floor = location.floors.where(Floor.name == data.target.floor)[0]
    x = data.target.x
    y = data.target.y

    shapes = [Shape.get_by_id(sh) for sh in data.shapes]

    await send_remove_shapes(
        [sh.uuid for sh in shapes], room=pr.active_location.get_path()
    )

    for shape in shapes:
        shape.layer = floor.layers.where(Layer.name == shape.layer.name)[0]
        shape.center_at(x, y)
        shape.save()

    for psid, player in game_state.get_users(active_location=location):
        await _send_game(
            "Shapes.Add",
            [
                transform_shape(sh, player, game_state.get(psid).role == Role.DM)
                for sh in shapes
            ],
            room=psid,
        )


@sio.on("Shape.CircularToken.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_circular_token_value(sid: str, raw_data: Any):
    data = ShapeTextValueSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape: CircularToken = CircularToken.get_by_id(data.uuid)
        shape.text = data.text
        shape.save()

    await _send_game(
        "Shape.CircularToken.Value.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Shape.Text.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_text_value(sid: str, raw_data: Any):
    data = ShapeTextValueSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape: Text = Text.get_by_id(data.uuid)
        shape.text = data.text
        shape.save()

    await _send_game(
        "Shape.Text.Value.Set", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shape.Rect.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_rect_size(sid: str, raw_data: Any):
    data = ShapeRectSizeUpdate(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape: Union[AssetRect, Rect]
        try:
            shape = AssetRect.get_by_id(data.uuid)
        except AssetRect.DoesNotExist:
            shape = Rect.get_by_id(data.uuid)
        shape.width = data.w
        shape.height = data.h
        shape.save()

    await _send_game(
        "Shape.Rect.Size.Update", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shape.Circle.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_circle_size(sid: str, raw_data: Any):
    data = ShapeCircleSizeUpdate(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape: Union[Circle, CircularToken]
        try:
            shape = CircularToken.get_by_id(data.uuid)
        except CircularToken.DoesNotExist:
            shape = Circle.get_by_id(data.uuid)
        shape.radius = data.r
        shape.save()

    await _send_game(
        "Shape.Circle.Size.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Shape.Text.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_text_size(sid: str, raw_data: Any):
    data = ShapeTextSizeUpdate(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shape = Text.get_by_id(data.uuid)

        shape.font_size = data.font_size
        shape.save()

    await _send_game(
        "Shape.Text.Size.Update", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shape.Asset.Image.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_asset_image(sid: str, raw_data: Any):
    data = ShapeAssetImageSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = AssetRect.get_by_id(data.uuid)

    shape.src = data.src
    shape.save()

    await _send_game(
        "Shape.Asset.Image.Set", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Shape.Info.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_shape_info(sid: str, shape_id: str):
    pr: PlayerRoom = game_state.get(sid)

    shape: Shape = Shape.get_by_id(shape_id)
    location = shape.layer.floor.location.id

    await _send_game(
        "Shape.Info",
        data=ShapeInfo(
            shape=transform_shape(shape, pr.player, False), location=location
        ),
        room=sid,
    )
