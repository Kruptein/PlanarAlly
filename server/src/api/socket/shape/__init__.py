from typing import Any, Optional, Union, cast

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
from ....db.typed import SelectSequence
from ....logs import logger
from ....models.access import has_ownership
from ....models.role import Role
from ....state.game import game_state
from ....transform.to_api.shape import transform_shape
from ...common.shapes import create_shape
from ...models.shape import (
    ApiShapeWithLayerInfo,
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
from ..asset_manager.core import clean_filehash
from ..constants import GAME_NS
from ..groups import remove_group_if_empty
from . import access, options, toggle_composite  # noqa: F401


@sio.on("Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape(sid: str, raw_data: Any):
    data = ShapeAdd(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        floor = pr.active_location.floors.where(Floor.name == data.floor)[0]
        layer = floor.layers.where(Layer.name == data.layer)[0]
    except IndexError:
        logger.error(
            f"Attempt to add a shape to unknown floor/layer {data.floor}/{data.layer}"
        )
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
            logger.error(f"Failed to create new shape {raw_data}")
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
                data.shape = transform_shape(shape, room_player)
            await _send_game(
                "Shape.Add",
                ApiShapeWithLayerInfo(
                    shape=data.shape, floor=floor.name, layer=layer.name
                ),
                room=psid,
            )


@sio.on("Shapes.Position.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_positions(sid: str, raw_data: Any):
    data = ShapesPositionUpdateList(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if not data.temporary:
        shapes: list[tuple[Shape, ShapePositionUpdate]] = []

        for sh in data.shapes:
            shape = Shape.get_or_none(Shape.uuid == sh.uuid)
            if shape is None:
                logger.warning(
                    f"User {pr.player.name} attempted to move a shape with unknown uuid ({sh.uuid})."
                )
                continue
            elif not has_ownership(shape, pr, movement=True):
                logger.warning(
                    f"User {pr.player.name} attempted to move a shape it does not own."
                )
                continue
            shapes.append((shape, sh))

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


def _get_shapes_from_uuids(
    uuids: list[str], filter_layer: bool
) -> SelectSequence[Shape]:
    query = Shape.select().where((Shape.uuid << uuids))  # type: ignore
    if filter_layer:
        query = query.where(~(Shape.layer >> None))  # type: ignore
    return query


@sio.on("Shapes.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shapes(sid: str, raw_data: Any):
    data = TemporaryShapes(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if data.temporary:
        # This stuff is not stored so we cannot do any server side validation /shrug
        for shape in data.uuids:
            game_state.remove_temp(sid, shape)

        await send_remove_shapes(
            data.uuids, room=pr.active_location.get_path(), skip_sid=sid
        )
    else:
        # Use the server version of the shapes.
        shapes = list(_get_shapes_from_uuids(data.uuids, True))
        if len(shapes) == 0:
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

            is_char_related = shape.character_id is not None
            # ToggleComposite patches
            if not is_char_related:
                parent = None
                if shape.composite_parent:
                    parent = shape.composite_parent[0].parent
                elif shape.type_ == "togglecomposite":
                    parent = shape
                if parent:
                    for csa in parent.shape_variants:
                        if csa.variant.character_id is not None:
                            is_char_related = True
                            break

            if not is_char_related:
                file_hash_to_clean = None
                if shape.type_ == "assetrect":
                    rect = cast(AssetRect, shape.subtype)
                    if rect.src.startswith("/static/assets"):
                        file_hash_to_clean = rect.src.split("/")[-1]

                old_index = shape.index
                shape.delete_instance(True)
                Shape.update(index=Shape.index - 1).where(
                    (Shape.layer == layer) & (Shape.index >= old_index)
                ).execute()

                # The Shape has to be removed before cleaning
                if file_hash_to_clean:
                    clean_filehash(file_hash_to_clean)
            else:
                shape.layer = None
                shape.save()

        for group_id in group_ids:
            await remove_group_if_empty(group_id)

        await send_remove_shapes(
            [sh.uuid for sh in shapes], room=pr.active_location.get_path(), skip_sid=sid
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
    shapes = list(_get_shapes_from_uuids(data.uuids, True))
    layer: Layer = Layer.get(
        floor=floor,
        name=shapes[0].layer.name,  # pyright: ignore[reportOptionalMemberAccess]
    )
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
    shapes = list(_get_shapes_from_uuids(data.uuids, True))
    layer = Layer.get(floor=floor, name=data.layer)
    old_layer = shapes[0].layer

    if old_layer is None:
        logger.error("Attempt to layer-move shape without layer")
        return

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
            for psid, tpr in game_state.get_t(
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
                            ApiShapeWithLayerInfo(
                                shape=transform_shape(shape, tpr),
                                floor=floor.name,
                                layer=layer.name,
                            )
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

        if layer is None:
            logger.error("Attempt to layer-order shape without layer")
            return

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

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move shape locations")
        return

    location = Location.get_by_id(data.target.location)
    floor = location.floors.where(Floor.name == data.target.floor)[0]

    target_layer = None
    if data.target.layer:
        target_layer = floor.layers.where(Layer.name == data.target.layer)[0]

    shape_uuids = set()
    shapes = []
    old_floor = None
    for shape in _get_shapes_from_uuids(data.shapes, False):
        if shape.uuid in shape_uuids:
            continue

        # toggle composite patch
        parent = None
        if shape.composite_parent:
            parent = shape.composite_parent[0].parent
            shape = Shape.get_by_id(parent.subtype.active_variant)
            print(f"Parent found for {shape.uuid}")

        layer = target_layer
        if shape.layer:
            if old_floor is None:
                old_floor = shape.layer.floor
            layer = floor.layers.where(Layer.name == shape.layer.name)[0]
        elif layer is None:
            logger.warn("Attempt to move a shape without layer info")
            continue

        # Shape can be different from the one checked at the start of the loop
        if shape.uuid not in shape_uuids:
            shape_uuids.add(shape.uuid)
            shapes.append((shape, layer))

        if parent:
            if parent.uuid not in shape_uuids:
                shape_uuids.add(parent.uuid)
                shapes.append((parent, layer))
            for csa in parent.shape_variants:
                variant = csa.variant
                if variant != shape and variant.uuid not in shape_uuids:
                    shape_uuids.add(variant.uuid)
                    shapes.append((variant, layer))

    if old_floor:
        await send_remove_shapes(
            [sh.uuid for sh, _ in shapes], room=old_floor.location.get_path()
        )

    for shape, layer in shapes:
        shape.layer = layer
        shape.center = data.target
        shape.save()

    for psid, tpr in game_state.get_t(active_location=location):
        await _send_game(
            "Shapes.Add",
            [
                ApiShapeWithLayerInfo(
                    shape=transform_shape(shape, tpr),
                    floor=floor.name,
                    layer=layer.name,
                )
                for shape, layer in shapes
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
    shape: Shape = Shape.get_by_id(shape_id)
    layer = shape.layer
    if layer is None:
        logger.error("Attempt to get shape info from shape without layer")
        return

    location = layer.floor.location.id

    await _send_game(
        "Shape.Info",
        data=ShapeInfo(
            position=shape.center, floor=layer.floor.name, location=location
        ),
        room=sid,
    )
