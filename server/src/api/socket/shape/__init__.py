from typing import Any, Dict, List, Optional, Tuple, Union, cast

from peewee import Case
from socketio import AsyncServer

import auth
from api.helpers import _send_game
from api.socket.constants import GAME_NS
from api.socket.groups import remove_group_if_empty
from api.socket.shape.data_models import *
from app import app, sio
from models import (
    AssetRect,
    Aura,
    Circle,
    CircularToken,
    Floor,
    Layer,
    PlayerRoom,
    Rect,
    Shape,
    ShapeOwner,
    Text,
    Tracker,
    User,
)
from models.campaign import Location
from models.db import db
from models.role import Role
from models.shape.access import has_ownership
from models.utils import get_table, reduce_data_to_model
from state.game import game_state
from logs import logger

from . import access, options, toggle_composite


@sio.on("Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_shape(sid: str, data: ShapeAdd):
    pr: PlayerRoom = game_state.get(sid)

    if "temporary" not in data:
        data["temporary"] = False

    try:
        floor = pr.active_location.floors.where(Floor.name == data["shape"]["floor"])[0]
        layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]
    except IndexError:
        return

    if pr.role != Role.DM and not layer.player_editable:
        logger.warning(f"{pr.player.name} attempted to add a shape to a dm layer")
        return
    if data["temporary"]:
        game_state.add_temp(sid, data["shape"]["uuid"])
    else:
        with db.atomic():
            data["shape"]["layer"] = layer
            data["shape"]["index"] = layer.shapes.count()
            # Shape itself
            shape = Shape.create(**reduce_data_to_model(Shape, data["shape"]))
            # Subshape
            type_table = get_table(shape.type_)
            if type_table is None:
                logger.error("UNKNOWN SHAPE TYPE DETECTED")
                return

            subshape = type_table.create(
                shape=shape,
                **type_table.pre_create(
                    **reduce_data_to_model(type_table, data["shape"])
                ),
            )
            type_table.post_create(subshape, **data["shape"])
            # Owners
            for owner in data["shape"]["owners"]:
                ShapeOwner.create(
                    shape=shape,
                    user=User.by_name(owner["user"]),
                    edit_access=owner["edit_access"],
                    movement_access=owner["movement_access"],
                    vision_access=owner["vision_access"],
                )
            # Trackers
            for tracker in data["shape"]["trackers"]:
                # do not shortline this to **reduce_data_to_model(...), shape=shape
                # if shape exists in the model it crashes
                tracker_model = reduce_data_to_model(Tracker, tracker)
                tracker_model.update(shape=shape)
                Tracker.create(**tracker_model)
            # Auras
            for aura in data["shape"]["auras"]:
                Aura.create(**reduce_data_to_model(Aura, aura))

    for room_player in pr.room.players:
        is_dm = cast(bool, room_player.role == Role.DM)
        for psid in game_state.get_sids(
            player=room_player.player, active_location=pr.active_location
        ):
            if psid == sid:
                continue
            if not is_dm and not layer.player_visible:
                continue
            if not data["temporary"]:
                data["shape"] = shape.as_dict(room_player.player, is_dm)  # type: ignore
            await sio.emit("Shape.Add", data["shape"], room=psid, namespace=GAME_NS)


@sio.on("Shapes.Position.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_positions(sid: str, data: PositionUpdateList):
    pr: PlayerRoom = game_state.get(sid)

    shapes: List[Tuple[Shape, PositionUpdate]] = []

    for sh in data["shapes"]:
        shape = Shape.get_or_none(Shape.uuid == sh["uuid"])
        if shape is not None and not has_ownership(shape, pr, movement=True):
            logger.warning(
                f"User {pr.player.name} attempted to move a shape it does not own."
            )
            return
        shapes.append((shape, sh))

    if not data["temporary"]:
        with db.atomic():
            for db_shape, data_shape in shapes:
                points = data_shape["position"]["points"]
                db_shape.x = points[0][0]
                db_shape.y = points[0][1]
                db_shape.angle = data_shape["position"]["angle"]
                db_shape.save()

                if len(points) > 1:
                    # Subshape
                    type_instance = db_shape.subtype
                    type_instance.set_location(points[1:])

    await sio.emit(
        "Shapes.Position.Update",
        data["shapes"],
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


async def send_remove_shapes(
    sio: AsyncServer, data: List[str], room: str, skip_sid: Optional[str] = None
):
    await _send_game(sio, "Shapes.Remove", data, room, skip_sid)


@sio.on("Shapes.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shapes(sid: str, data: TemporaryShapesList):
    pr: PlayerRoom = game_state.get(sid)

    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        for shape in data["uuids"]:
            game_state.remove_temp(sid, shape)
    else:
        # Use the server version of the shapes.
        try:
            shapes: List[Shape] = [
                s for s in Shape.select().where(Shape.uuid << data["uuids"])  # type: ignore
            ]
        except Shape.DoesNotExist:
            logger.warning(f"Attempt to update unknown shape by {pr.player.name}")
            return

        layer = shapes[0].layer

        group_ids = set()

        for shape in shapes:
            if not has_ownership(shape, pr):
                logger.warning(
                    f"User {pr.player.name} tried to update a shape it does not own."
                )
                return

            if shape.group:
                group_ids.add(shape.group)

            old_index = shape.index
            shape.delete_instance(True)
            Shape.update(index=Shape.index - 1).where(
                (Shape.layer == layer) & (Shape.index >= old_index)
            ).execute()

        for group_id in group_ids:
            await remove_group_if_empty(group_id)

    await send_remove_shapes(sio, data["uuids"], pr.active_location.get_path(), sid)


@sio.on("Shapes.Floor.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_shape_floor(sid: str, data: ShapeFloorChange):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the floor of a shape")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["floor"])
    shapes: List[Shape] = [s for s in Shape.select().where(Shape.uuid << data["uuids"])]  # type: ignore
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

    await sio.emit(
        "Shapes.Floor.Change",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Layer.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_shape_layer(sid: str, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the layer of a shape")
        return

    floor = Floor.get(location=pr.active_location, name=data["floor"])
    shapes: List[Shape] = [s for s in Shape.select().where(Shape.uuid << data["uuids"])]
    layer = Layer.get(floor=floor, name=data["layer"])
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
                await send_remove_shapes(sio, data["uuids"], psid)

    for shape in shapes:
        old_index = shape.index

        shape.layer = layer
        shape.index = layer.shapes.count()
        shape.save()
        Shape.update(index=Shape.index - 1).where(
            (Shape.layer == old_layer) & (Shape.index >= old_index)
        ).execute()

    if old_layer.player_visible and layer.player_visible:
        await sio.emit(
            "Shapes.Layer.Change",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
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
                    await sio.emit(
                        "Shapes.Layer.Change",
                        data,
                        room=psid,
                        skip_sid=sid,
                        namespace=GAME_NS,
                    )
                elif layer.player_visible:
                    await sio.emit(
                        "Shapes.Add",
                        [shape.as_dict(room_player.player, False) for shape in shapes],
                        room=psid,
                        namespace=GAME_NS,
                    )


@sio.on("Shape.Order.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_shape_order(sid: str, data: ShapeOrder):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape = Shape.get(uuid=data["uuid"])
        layer = shape.layer

        if pr.role != Role.DM and not layer.player_editable:
            logger.warning(
                f"{pr.player.name} attempted to move a shape order on a dm layer"
            )
            return

        target = data["index"]
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

    await sio.emit(
        "Shape.Order.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Location.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_shapes(sid: str, data: ServerShapeLocationMove):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM and not data["tp_zone"]:
        logger.warning(f"{pr.player.name} attempted to move shape locations")
        return

    location = Location.get_by_id(data["target"]["location"])
    floor = location.floors.where(Floor.name == data["target"]["floor"])[0]
    x = data["target"]["x"]
    y = data["target"]["y"]

    shapes = [Shape.get_by_id(sh) for sh in data["shapes"]]

    await send_remove_shapes(
        sio, [sh.uuid for sh in shapes], pr.active_location.get_path()
    )

    for shape in shapes:
        shape.layer = floor.layers.where(Layer.name == shape.layer.name)[0]
        shape.center_at(x, y)
        shape.save()

    for psid, player in game_state.get_users(active_location=location):
        await sio.emit(
            "Shapes.Add",
            [sh.as_dict(player, game_state.get(psid).role == Role.DM) for sh in shapes],
            room=psid,
            namespace=GAME_NS,
        )


@sio.on("Shape.CircularToken.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_circular_token_value(sid: str, data: TextUpdateData):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape: CircularToken = CircularToken.get_by_id(data["uuid"])
        shape.text = data["text"]
        shape.save()

    await sio.emit(
        "Shape.CircularToken.Value.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Text.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_text_value(sid: str, data: TextUpdateData):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape: Text = Text.get_by_id(data["uuid"])
        shape.text = data["text"]
        shape.save()

    await sio.emit(
        "Shape.Text.Value.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Rect.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_rect_size(sid: str, data: RectSizeData):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape: Union[AssetRect, Rect]
        try:
            shape = AssetRect.get_by_id(data["uuid"])
        except AssetRect.DoesNotExist:
            shape = Rect.get_by_id(data["uuid"])
        shape.width = data["w"]
        shape.height = data["h"]
        shape.save()

    await sio.emit(
        "Shape.Rect.Size.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Circle.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_circle_size(sid: str, data: CircleSizeData):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape: Union[Circle, CircularToken]
        try:
            shape = CircularToken.get_by_id(data["uuid"])
        except CircularToken.DoesNotExist:
            shape = Circle.get_by_id(data["uuid"])
        shape.radius = data["r"]
        shape.save()

    await sio.emit(
        "Shape.Circle.Size.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Text.Size.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_text_size(sid: str, data: TextSizeData):
    pr: PlayerRoom = game_state.get(sid)

    if not data["temporary"]:
        shape = Text.get_by_id(data["uuid"])

        shape.font_size = data["font_size"]
        shape.save()

    await sio.emit(
        "Shape.Text.Size.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Options.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_options(sid: str, data: OptionUpdateList):
    pr: PlayerRoom = game_state.get(sid)

    shapes: List[Tuple[Shape, OptionUpdate]] = []

    for sh in data["options"]:
        shape = Shape.get_or_none(Shape.uuid == sh["uuid"])
        if shape is not None and not has_ownership(shape, pr, movement=True):
            logger.warning(
                f"User {pr.player.name} attempted to change options for a shape it does not own."
            )
            return
        shapes.append((shape, sh))

    if not data["temporary"]:
        with db.atomic():
            for db_shape, data_shape in shapes:
                db_shape.options = data_shape["option"]
                db_shape.save()

    await sio.emit(
        "Shapes.Options.Update",
        data["options"],
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Info.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_shape_info(sid: str, shape_id: str):
    pr: PlayerRoom = game_state.get(sid)

    shape: Shape = Shape.get_by_id(shape_id)
    location = shape.layer.floor.location.id

    await sio.emit(
        "Shape.Info",
        data={"shape": shape.as_dict(pr.player, False), "location": location},
        room=sid,
        namespace=GAME_NS,
    )
