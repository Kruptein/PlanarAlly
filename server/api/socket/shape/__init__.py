from copy import deepcopy
from datetime import datetime
from typing import Any, Dict

from peewee import Case
from playhouse.shortcuts import update_model_from_dict

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import (
    Aura,
    Floor,
    Label,
    Layer,
    PlayerRoom,
    Room,
    Shape,
    ShapeLabel,
    ShapeOwner,
    Tracker,
    User,
)
from models.campaign import Location
from models.db import db
from models.role import Role
from models.shape.access import has_ownership, has_ownership_temp
from models.utils import get_table, reduce_data_to_model
from state.game import game_state

from . import access, options


@sio.on("Shape.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_shape(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if "temporary" not in data:
        data["temporary"] = False

    floor = pr.active_location.floors.select().where(
        Floor.name == data["shape"]["floor"]
    )[0]
    layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]

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
                Aura.create(**reduce_data_to_model(Aura, aura), shape=shape)

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


@sio.on("Shape.Position.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_shape_position(sid: str, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if data["temporary"] and not has_ownership_temp(data["shape"], pr):
        logger.warning(
            f"User {pr.player.name} attempted to move a shape it does not own."
        )
        return

    shape, layer = await _get_shape(data, pr)

    # Overwrite the old data with the new data
    if not data["temporary"]:
        if not has_ownership(shape, pr):
            logger.warning(
                f"User {pr.player.name} attempted to move a shape it does not own."
            )
            return

        with db.atomic():
            # Shape
            update_model_from_dict(shape, reduce_data_to_model(Shape, data["shape"]))
            shape.save()
            if shape.type_ == "polygon":
                # Subshape
                type_instance = shape.subtype
                # no backrefs on these tables
                type_instance.update_from_dict(data["shape"], ignore_unknown=True)
                type_instance.save()

    await sync_shape_update(layer, pr, data, sid, shape)


@sio.on("Shape.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_shape(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if data["temporary"] and not has_ownership_temp(data["shape"], pr):
        logger.warning(
            f"User {pr.player.name} tried to update a shape it does not own."
        )
        return

    # todo clean up this mess that deals with both temporary and non temporary shapes
    shape, layer = await _get_shape(data, pr)

    # Overwrite the old data with the new data
    if not data["temporary"]:
        if not has_ownership(shape, pr):
            logger.warning(
                f"User {pr.player.name} tried to update a shape it does not own."
            )
            return
        with db.atomic():
            # Shape
            update_model_from_dict(shape, reduce_data_to_model(Shape, data["shape"]))
            shape.save()
            # Subshape
            type_instance = shape.subtype
            # no backrefs on these tables
            type_instance.update_from_dict(data["shape"], ignore_unknown=True)
            type_instance.save()
            # Trackers
            old_trackers = {tracker.uuid for tracker in shape.trackers}
            new_trackers = {tracker["uuid"] for tracker in data["shape"]["trackers"]}
            for tracker_id in old_trackers | new_trackers:
                remove = tracker_id in old_trackers - new_trackers
                if not remove:
                    tracker = next(
                        tr
                        for tr in data["shape"]["trackers"]
                        if tr["uuid"] == tracker_id
                    )
                    reduced = reduce_data_to_model(Tracker, tracker)
                    reduced["shape"] = shape
                if tracker_id in new_trackers - old_trackers:
                    Tracker.create(**reduced)
                    continue
                tracker_db = Tracker.get(uuid=tracker_id)
                if remove:
                    tracker_db.delete_instance(True)
                else:
                    update_model_from_dict(tracker_db, reduced)
                    tracker_db.save()

            # Auras
            old_auras = {aura.uuid for aura in shape.auras}
            new_auras = {aura["uuid"] for aura in data["shape"]["auras"]}
            for aura_id in old_auras | new_auras:
                remove = aura_id in old_auras - new_auras
                if not remove:
                    aura = next(
                        au for au in data["shape"]["auras"] if au["uuid"] == aura_id
                    )
                    reduced = reduce_data_to_model(Aura, aura)
                    reduced["shape"] = shape
                if aura_id in new_auras - old_auras:
                    Aura.create(**reduced)
                    continue
                aura_db = Aura.get_or_none(uuid=aura_id)
                if remove:
                    aura_db.delete_instance(True)
                else:
                    update_model_from_dict(aura_db, reduced)
                    aura_db.save()
            # Labels
            for label in data["shape"]["labels"]:
                label_db = Label.get_or_none(uuid=label["uuid"])
                reduced = reduce_data_to_model(Label, label)
                reduced["user"] = User.by_name(reduced["user"])
                if label_db:
                    update_model_from_dict(label_db, reduced)
                    label_db.save()
                else:
                    Label.create(**reduced)
            old_labels = {shape_label.label.uuid for shape_label in shape.labels}
            new_labels = set(label["uuid"] for label in data["shape"]["labels"])
            for label in old_labels ^ new_labels:
                if label == "":
                    continue
                if label in new_labels:
                    ShapeLabel.create(shape=shape, label=Label.get(uuid=label))
                else:
                    ShapeLabel.get(
                        label=Label.get(uuid=label), shape=shape
                    ).delete_instance(True)

    await sync_shape_update(layer, pr, data, sid, shape)


@sio.on("Shape.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_shape(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        if not has_ownership_temp(data["shape"], pr):
            logger.warning(
                f"User {pr.player.name} tried to update a shape it does not own."
            )
            return

        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        floor = pr.active_location.floors.select().where(
            Floor.name == data["shape"]["floor"]
        )[0]
        layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]
    else:
        # Use the server version of the shape.
        try:
            shape = Shape.get(uuid=data["shape"]["uuid"])
        except Shape.DoesNotExist:
            logger.warning(f"Attempt to update unknown shape by {pr.player.name}")
            return
        layer = shape.layer

        if not has_ownership(shape, pr):
            logger.warning(
                f"User {pr.player.name} tried to update a shape it does not own."
            )
            return

    if data["temporary"]:
        game_state.remove_temp(sid, data["shape"]["uuid"])
    else:
        old_index = shape.index
        shape.delete_instance(True)
        Shape.update(index=Shape.index - 1).where(
            (Shape.layer == layer) & (Shape.index >= old_index)
        ).execute()

    if layer.player_visible:
        await sio.emit(
            "Shape.Remove",
            data["shape"],
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
        )
    else:
        for csid in game_state.get_sids(
            player=pr.room.creator, active_location=pr.active_location
        ):
            if csid == sid:
                continue
            await sio.emit("Shape.Remove", data["shape"], room=csid, namespace=GAME_NS)


@sio.on("Shape.Floor.Change", namespace=GAME_NS)
@auth.login_required(app, sio)
async def change_shape_floor(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the floor of a shape")
        return

    floor: Floor = Floor.get(location=pr.active_location, name=data["floor"])
    shape: Shape = Shape.get(uuid=data["uuid"])
    layer: Layer = Layer.get(floor=floor, name=shape.layer.name)
    old_layer = shape.layer
    old_index = shape.index

    shape.layer = layer
    shape.index = layer.shapes.count()
    shape.save()

    Shape.update(index=Shape.index - 1).where(
        (Shape.layer == old_layer) & (Shape.index >= old_index)
    ).execute()

    await sio.emit(
        "Shape.Floor.Change",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Shape.Layer.Change", namespace=GAME_NS)
@auth.login_required(app, sio)
async def change_shape_layer(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move the layer of a shape")
        return

    floor = Floor.get(location=pr.active_location, name=data["floor"])
    layer = Layer.get(floor=floor, name=data["layer"])
    shape = Shape.get(uuid=data["uuid"])
    old_layer = shape.layer
    old_index = shape.index

    if old_layer.player_visible and not layer.player_visible:
        for room_player in pr.room.players:
            if room_player.role == Role.DM:
                continue
            for psid in game_state.get_sids(
                player=room_player.player, active_location=pr.active_location
            ):
                if psid == sid:
                    continue
                await sio.emit(
                    "Shape.Remove",
                    shape.as_dict(room_player.player, False),
                    room=psid,
                    namespace=GAME_NS,
                )

    shape.layer = layer
    shape.index = layer.shapes.count()
    shape.save()
    Shape.update(index=Shape.index - 1).where(
        (Shape.layer == old_layer) & (Shape.index >= old_index)
    ).execute()

    if old_layer.player_visible and layer.player_visible:
        await sio.emit(
            "Shape.Layer.Change",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
        )
    else:
        for room_player in pr.room.players:
            is_dm = room_player.role == Role.DM
            for psid in game_state.get_sids(
                player=room_player.player, active_location=pr.active_location
            ):
                if psid == sid:
                    continue
                if is_dm:
                    await sio.emit(
                        "Shape.Layer.Change",
                        data,
                        room=pr.active_location.get_path(),
                        skip_sid=sid,
                        namespace=GAME_NS,
                    )
                elif layer.player_visible:
                    await sio.emit(
                        "Shape.Add",
                        shape.as_dict(room_player.player, False),
                        room=psid,
                        namespace=GAME_NS,
                    )


@sio.on("Shape.Order.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def move_shape_order(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    shape = Shape.get(uuid=data["shape"]["uuid"])
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
            await sio.emit(
                "Shape.Order.Set", data["shape"], room=csid, namespace=GAME_NS
            )


async def sync_shape_update(layer, pr: PlayerRoom, data, sid, shape):
    for psid, player in game_state.get_users(active_location=pr.active_location):
        if psid == sid:
            continue
        pdata = {el: data[el] for el in data if el != "shape"}
        if data["temporary"]:
            if player != pr.room.creator and not (
                data["shape"]["default_edit_access"]
                or any(player.name == o["user"] for o in data["shape"]["owners"])
            ):
                pdata["shape"] = deepcopy(data["shape"])
                # Although we have no guarantees that the message is faked, we still would like to verify data as if it were legitimate.
                for element in ["auras", "labels", "trackers"]:
                    pdata["shape"][element] = [
                        el for el in pdata["shape"][element] if el["visible"]
                    ]
                if not pdata["shape"]["name_visible"]:
                    pdata["shape"]["name"] = "?"
            else:
                pdata["shape"] = shape
            try:
                pdata["shape"]["layer"] = pdata["shape"]["layer"].name
            except AttributeError:
                pass  # To solve this error, we need to clean this mess of shape functions
        else:
            pdata["shape"] = shape.as_dict(player, player == pr.room.creator)
        await sio.emit("Shape.Update", pdata, room=psid, namespace=GAME_NS)


async def _get_shape(data: Dict[str, Any], pr: PlayerRoom):
    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        floor = pr.active_location.floors.select().where(Floor.name == shape["floor"])[
            0
        ]
        layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]
    else:
        # Use the server version of the shape.
        try:
            shape = Shape.get(uuid=data["shape"]["uuid"])
        except Shape.DoesNotExist as exc:
            logger.warning(
                f"Attempt to update unknown shape by {pr.player.name} [{data['shape']['uuid']}]"
            )
            raise exc
        layer = shape.layer

    data["shape"]["layer"] = layer

    return shape, layer


@sio.on("Shapes.Location.Move", namespace=GAME_NS)
@auth.login_required(app, sio)
async def move_shapes(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to move shape locations")
        return

    location = Location[data["target"]["location"]]
    floor = location.floors.select().where(Floor.name == data["target"]["floor"])[0]
    x = data["target"]["x"]
    y = data["target"]["y"]

    shapes = [Shape[sh] for sh in data["shapes"]]

    for psid, player in game_state.get_users(active_location=pr.active_location):
        await sio.emit(
            "Shapes.Remove",
            [sh.as_dict(player, player == pr.room.creator) for sh in shapes],
            room=psid,
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
