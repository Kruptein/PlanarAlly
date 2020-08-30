from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, Generic, List, Tuple, Union

from peewee import Case
from playhouse.shortcuts import update_model_from_dict

import auth
from api.socket.constants import GAME_NS
from api.socket.shape.data_models import *
from app import app, sio
from models import (
    AssetRect,
    Aura,
    Circle,
    CircularToken,
    Floor,
    Label,
    Layer,
    PlayerRoom,
    Rect,
    Room,
    Shape,
    ShapeLabel,
    ShapeOwner,
    Text,
    Tracker,
    User,
)
from models.campaign import Location
from models.db import db
from models.role import Role
from models.shape.access import has_ownership, has_ownership_temp
from models.utils import get_table, reduce_data_to_model
from state.game import game_state
from utils import logger

from . import access, options


@sio.on("Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_shape(sid: str, data: ShapeAdd):
    pr: PlayerRoom = game_state.get(sid)

    if "temporary" not in data:
        data["temporary"] = False

    try:
        floor = pr.active_location.floors.select().where(
            Floor.name == data["shape"]["floor"]
        )[0]
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
            type_table.create(
                shape=shape,
                **type_table.pre_create(
                    **reduce_data_to_model(type_table, data["shape"])
                ),
            )
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
                Tracker.create(**reduce_data_to_model(Tracker, tracker), shape=shape)
            # Auras
            for aura in data["shape"]["auras"]:
                Aura.create(**reduce_data_to_model(Aura, aura))

    for room_player in pr.room.players:
        is_dm = room_player.role == Role.DM
        for psid in game_state.get_sids(
            player=room_player.player, active_location=pr.active_location
        ):
            if psid == sid:
                continue
            if not is_dm and not layer.player_visible:
                continue
            if not data["temporary"]:
                data["shape"] = shape.as_dict(room_player.player, is_dm)
            await sio.emit("Shape.Add", data["shape"], room=psid, namespace=GAME_NS)


@sio.on("Shapes.Position.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_shape_positions(sid: str, data: PositionUpdateList):
    pr: PlayerRoom = game_state.get(sid)

    shapes: List[Tuple[Shape, PositionUpdate]] = []

    for sh in data["shapes"]:
        shape = Shape.get_or_none(Shape.uuid == sh["uuid"])
        if shape is not None and not has_ownership(shape, pr):
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


@sio.on("Shapes.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
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
                s for s in Shape.select().where(Shape.uuid << data["uuids"])
            ]
        except Shape.DoesNotExist:
            logger.warning(f"Attempt to update unknown shape by {pr.player.name}")
            return

        layer = shapes[0].layer

        for shape in shapes:
            if not has_ownership(shape, pr):
                logger.warning(
                    f"User {pr.player.name} tried to update a shape it does not own."
                )
                return

            old_index = shape.index
            shape.delete_instance(True)
            Shape.update(index=Shape.index - 1).where(
                (Shape.layer == layer) & (Shape.index >= old_index)
            ).execute()

    await sio.emit(
        "Shapes.Remove",
        data["uuids"],
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Floor.Change", namespace=GAME_NS)
@auth.login_required(app, sio)
async def change_shape_floor(sid: str, data: ShapeFloorChange):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the floor of a shape")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["floor"])
    shapes: List[Shape] = [s for s in Shape.select().where(Shape.uuid << data["uuids"])]
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
@auth.login_required(app, sio)
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
                await sio.emit(
                    "Shapes.Remove", data["uuids"], room=psid, namespace=GAME_NS,
                )

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
@auth.login_required(app, sio)
async def move_shape_order(sid: str, data: ShapeOrder):
    pr: PlayerRoom = game_state.get(sid)

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
            ((sign * Shape.index) < (sign * shape.index), (Shape.index + (sign * 1))),
        ),
        Shape.index,
    )
    Shape.update(index=case).where(Shape.layer == layer).execute()
    if layer.player_visible:
        await sio.emit(
            "Shape.Order.Set",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
        )
    else:
        for csid in game_state.get_sids(player=pr.room.creator, room=pr.room):
            if csid == sid:
                continue
            await sio.emit("Shape.Order.Set", data, room=csid, namespace=GAME_NS)


@sio.on("Shapes.Location.Move", namespace=GAME_NS)
@auth.login_required(app, sio)
async def move_shapes(sid: str, data: ServerShapeLocationMove):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move shape locations")
        return

    location = Location.get_by_id(data["target"]["location"])
    floor = location.floors.select().where(Floor.name == data["target"]["floor"])[0]
    x = data["target"]["x"]
    y = data["target"]["y"]

    shapes = [Shape.get_by_id(sh) for sh in data["shapes"]]

    await sio.emit(
        "Shapes.Remove",
        [sh.uuid for sh in shapes],
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )

    for shape in shapes:
        shape.layer = floor.layers.where(Layer.name == shape.layer.name)[0]
        shape.center_at(x, y)
        shape.save()

    for psid, player in game_state.get_users(active_location=location):
        await sio.emit(
            "Shapes.Add",
            [sh.as_dict(player, player == pr.room.creator) for sh in shapes],
            room=psid,
            namespace=GAME_NS,
        )


@sio.on("Shapes.Group.Leader.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_group_leader(sid: str, data: GroupLeaderData):
    pr: PlayerRoom = game_state.get(sid)

    leader_shape = Shape.get_by_id(data["leader"])
    leader_options = leader_shape.get_options()

    if "groupId" in leader_options:
        del leader_options["groupId"]
    leader_options["groupInfo"] = data["members"]
    leader_shape.set_options(leader_options)
    leader_shape.save()

    for member in data["members"]:
        shape = Shape.get_by_id(member)
        options = shape.get_options()
        options["groupId"] = data["leader"]
        shape.set_options(options)
        shape.save()

    await sio.emit(
        "Shapes.Group.Leader.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Group.Member.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_group_member(sid: str, data: GroupMemberAddData):
    pr: PlayerRoom = game_state.get(sid)

    leader_shape = Shape.get_by_id(data["leader"])
    leader_options = leader_shape.get_options()

    leader_options["groupInfo"].append(data["member"])
    leader_shape.set_options(leader_options)
    leader_shape.save()

    await sio.emit(
        "Shapes.Group.Member.Add",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shapes.Trackers.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_shape_tracker(sid: str, data: TrackerUpdateData):
    pr: PlayerRoom = game_state.get(sid)

    if data["_type"] == "tracker":
        tracker = Tracker.get_by_id(data["uuid"])
    else:
        tracker = Aura.get_by_id(data["uuid"])

    tracker.value = data["value"]
    tracker.save()

    await sio.emit(
        "Shapes.Trackers.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Text.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
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
@auth.login_required(app, sio)
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
@auth.login_required(app, sio)
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
