from copy import deepcopy
from datetime import datetime
from peewee import Case
from playhouse.shortcuts import update_model_from_dict

import auth
from .initiative import send_client_initiatives
from app import app, logger, sio, state
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
from models.db import db
from models.utils import get_table, reduce_data_to_model


@sio.on("Shape.Add", namespace="/planarally")
@auth.login_required(app, sio)
async def add_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if "temporary" not in data:
        data["temporary"] = False

    floor = location.floors.select().where(Floor.name == data["shape"]["floor"])[0]
    layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]

    if room.creator != user and not layer.player_editable:
        logger.warning(f"{user.name} attempted to add a shape to a dm layer")
        return
    if data["temporary"]:
        state.add_temp(sid, data["shape"]["uuid"])
    else:
        with db.atomic():
            data["shape"]["layer"] = layer
            data["shape"]["index"] = layer.shapes.count()
            # Shape itself
            shape = Shape.create(**reduce_data_to_model(Shape, data["shape"]))
            # Subshape
            type_table = get_table(shape.type_)
            type_table.create(
                shape=shape, **reduce_data_to_model(type_table, data["shape"])
            )
            # Owners
            ShapeOwner.create(shape=shape, user=user)
            # Trackers
            for tracker in data["shape"]["trackers"]:
                Tracker.create(**reduce_data_to_model(Tracker, tracker), shape=shape)
            # Auras
            for aura in data["shape"]["auras"]:
                Aura.create(**reduce_data_to_model(Aura, aura), shape=shape)

    if layer.player_visible:
        for room_player in room.players:
            for psid in state.get_sids(user=room_player.player, room=room):
                if psid == sid:
                    continue
                if not data["temporary"]:
                    data["shape"] = shape.as_dict(room_player.player, False)
                await sio.emit(
                    "Shape.Add", data["shape"], room=psid, namespace="/planarally"
                )

    for csid in state.get_sids(user=room.creator, room=room):
        if csid == sid:
            continue
        if not data["temporary"]:
            data["shape"] = shape.as_dict(room.creator, True)
        await sio.emit("Shape.Add", data["shape"], room=csid, namespace="/planarally")


@sio.on("Shape.Position.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_shape_position(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    shape, layer = await _get_shape(data, location, user)

    if not await has_ownership(layer, room, data, user, shape):
        return

    # Overwrite the old data with the new data
    if not data["temporary"]:
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

    await sync_shape_update(layer, room, data, sid, shape)


@sio.on("Shape.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    shape, layer = await _get_shape(data, location, user)

    if not await has_ownership(layer, room, data, user, shape):
        return

    # Overwrite the old data with the new data
    if not data["temporary"]:
        with db.atomic():
            # Shape
            update_model_from_dict(shape, reduce_data_to_model(Shape, data["shape"]))
            shape.save()
            # Subshape
            type_instance = shape.subtype
            # no backrefs on these tables
            type_instance.update_from_dict(data["shape"], ignore_unknown=True)
            type_instance.save()
            # Owners
            old_owners = {owner.user.name for owner in shape.owners}
            new_owners = set(data["shape"]["owners"])
            for owner in old_owners ^ new_owners:
                if owner == "":
                    continue
                delta_owner = User.by_name(owner)
                if owner in new_owners:
                    ShapeOwner.create(shape=shape, user=delta_owner)
                else:
                    ShapeOwner.get(shape=shape, user=delta_owner).delete_instance(True)
                await send_client_initiatives(room, location, delta_owner)
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
                shape_label_db = ShapeLabel.get_or_none(shape=shape, label=label_db)
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

    await sync_shape_update(layer, room, data, sid, shape)


@sio.on("Shape.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def remove_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        floor = location.floors.select().where(Floor.name == data["shape"]["floor"])[0]
        layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]
    else:
        # Use the server version of the shape.
        try:
            shape = Shape.get(uuid=data["shape"]["uuid"])
        except Shape.DoesNotExist:
            logger.warning(f"Attempt to update unknown shape by {user.name}")
            return
        layer = shape.layer

    # Ownership validatation
    if room.creator != user:
        if not layer.player_editable:
            logger.warning(f"{user.name} attempted to remove a shape on a dm layer")
            return

        if data["temporary"]:
            if user.name not in shape["owners"]:
                logger.warning(f"{user.name} attempted to remove asset it does not own")
                return
        else:
            if not ShapeOwner.get_or_none(shape=shape, user=user):
                logger.warning(f"{user.name} attempted to remove asset it does not own")
                return

    if data["temporary"]:
        state.remove_temp(sid, data["shape"]["uuid"])
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
            room=location.get_path(),
            skip_sid=sid,
            namespace="/planarally",
        )
    else:
        for csid in state.get_sids(user=room.creator, room=room):
            if csid == sid:
                continue
            await sio.emit(
                "Shape.Remove", data["shape"], room=csid, namespace="/planarally"
            )


@sio.on("Shape.Floor.Change", namespace="/planarally")
@auth.login_required(app, sio)
async def change_shape_layer(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to move the floor of a shape")
        return

    floor: Floor = Floor.get(location=location, name=data["floor"])
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
        room=location.get_path(),
        skip_sid=sid,
        namespace="/planarally",
    )


@sio.on("Shape.Layer.Change", namespace="/planarally")
@auth.login_required(app, sio)
async def change_shape_layer(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to move the layer of a shape")
        return

    floor = Floor.get(location=location, name=data["floor"])
    layer = Layer.get(floor=floor, name=data["layer"])
    shape = Shape.get(uuid=data["uuid"])
    old_layer = shape.layer
    old_index = shape.index

    if old_layer.player_visible and not layer.player_visible:
        for room_player in room.players:
            for psid in state.get_sids(user=room_player.player, room=room):
                if psid == sid:
                    continue
                await sio.emit(
                    "Shape.Remove",
                    shape.as_dict(room_player.player, False),
                    room=psid,
                    namespace="/planarally",
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
            room=location.get_path(),
            skip_sid=sid,
            namespace="/planarally",
        )
    else:
        for csid in state.get_sids(user=room.creator, room=room):
            if csid == sid:
                continue
            await sio.emit(
                "Shape.Layer.Change",
                data,
                room=location.get_path(),
                skip_sid=sid,
                namespace="/planarally",
            )
        if layer.player_visible:
            for room_player in room.players:
                for psid in state.get_sids(user=room_player.player, room=room):
                    if psid == sid:
                        continue
                    await sio.emit(
                        "Shape.Add",
                        shape.as_dict(room_player.player, False),
                        room=psid,
                        namespace="/planarally",
                    )


@sio.on("Shape.Order.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape_order(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    shape = Shape.get(uuid=data["shape"]["uuid"])
    layer = shape.layer

    if room.creator != user and not layer.player_editable:
        logger.warning(f"{user.name} attempted to move a shape order on a dm layer")
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
            room=location.get_path(),
            skip_sid=sid,
            namespace="/planarally",
        )
    else:
        for csid in state.get_sids(user=room.creator, room=room):
            if csid == sid:
                continue
            await sio.emit(
                "Shape.Order.Set", data["shape"], room=csid, namespace="/planarally"
            )


async def sync_shape_update(layer, room: Room, data, sid, shape):
    for psid, player in state.get_players(room=room):
        if psid == sid:
            continue
        pdata = {el: data[el] for el in data if el != "shape"}
        if data["temporary"]:
            if player != room.creator and player.name not in data["shape"]["owners"]:
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
                logger.error(
                    f"Shape {pdata['shape']} does not have an expected layer configuration"
                )
        else:
            pdata["shape"] = shape.as_dict(player, player == room.creator)
        await sio.emit("Shape.Update", pdata, room=psid, namespace="/planarally")


async def _get_shape(data, location, user):
    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        floor = location.floors.select().where(Floor.name == shape["floor"])[0]
        layer = floor.layers.where(Layer.name == data["shape"]["layer"])[0]
    else:
        # Use the server version of the shape.
        try:
            shape = Shape.get(uuid=data["shape"]["uuid"])
        except Shape.DoesNotExist as exc:
            logger.warning(
                f"Attempt to update unknown shape by {user.name} [{data['shape']['uuid']}]"
            )
            raise exc
        layer = shape.layer

    data["shape"]["layer"] = layer

    return shape, layer


async def has_ownership(layer, room, data, user, shape):
    # Ownership validatation
    if room.creator != user:
        if not layer.player_editable:
            logger.warning(f"{user.name} attempted to move a shape on a dm layer")
            return False

        if data["temporary"]:
            if user.name not in shape["owners"]:
                logger.warning(f"{user.name} attempted to move asset it does not own")
                return False
        else:
            if not ShapeOwner.get_or_none(shape=shape, user=user):
                logger.warning(f"{user.name} attempted to move asset it does not own")
                return False
    return True
