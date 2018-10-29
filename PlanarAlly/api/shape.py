from peewee import Case
from playhouse.shortcuts import update_model_from_dict

import auth
from app import app, logger, sio, state
from models import Aura, Layer, Shape, ShapeOwner, Tracker, User
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

    layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]

    if room.creator != user and not layer.player_editable:
        logger.warning(f"{user.name} attempted to add a shape to a dm layer")
        return
    if data["temporary"]:
        state.add_temp(sid, data["shape"]["uuid"])
    else:
        with db.atomic():
            data["shape"]["layer"] = Layer.get(
                location=location, name=data["shape"]["layer"]
            )
            data["shape"]["index"] = layer.shapes.count() + 1
            # Shape itself
            shape = Shape.create(**reduce_data_to_model(Shape, data["shape"]))
            # Subshape
            type_table = get_table(shape.type_)
            type_table.create(**reduce_data_to_model(type_table, data["shape"]))
            # Owners
            ShapeOwner.create(shape=shape, user=user)
            # Trackers
            for tracker in data["shape"]["trackers"]:
                Tracker.create(**reduce_data_to_model(Tracker, tracker))
            # Auras
            for aura in data["shape"]["auras"]:
                Aura.create(**reduce_data_to_model(Aura, aura))

    if layer.player_visible:
        for room_player in room.players:
            for psid in state.get_sids(room_player.player, room):
                if psid == sid:
                    continue
                if not data["temporary"]:
                    data["shape"] = shape.as_dict(room_player.player, False)
                await sio.emit(
                    "Shape.Add", data["shape"], room=psid, namespace="/planarally"
                )

    for csid in state.get_sids(room.creator, room):
        if csid == sid:
            continue
        if not data["temporary"]:
            data["shape"] = shape.as_dict(room.creator, True)
        await sio.emit("Shape.Add", data["shape"], room=csid, namespace="/planarally")


@sio.on("Shape.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]
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
            logger.warning(f"{user.name} attempted to move a shape on a dm layer")
            return

        if data["temporary"]:
            if user.name not in shape["owners"]:
                logger.warning(f"{user.name} attempted to move asset it does not own")
                return
        else:
            if not ShapeOwner.get_or_none(shape=shape, user=user):
                logger.warning(f"{user.name} attempted to move asset it does not own")
                return

    # Overwrite the old data with the new data
    if not data["temporary"]:
        with db.atomic():
            data["shape"]["layer"] = Layer.get(
                location=location, name=data["shape"]["layer"]
            )
            # Otherwise backrefs can cause errors as they need to be handled separately
            update_model_from_dict(shape, reduce_data_to_model(Shape, data["shape"]))
            shape.save()
            type_table = get_table(shape.type_)
            type_instance = type_table.get(uuid=shape.uuid)
            # no backrefs on these tables
            update_model_from_dict(type_instance, data["shape"], ignore_unknown=True)
            type_instance.save()

            old_owners = {owner.user.name for owner in shape.owners}
            new_owners = set(data["shape"]["owners"])
            for owner in old_owners ^ new_owners:
                if owner == "":
                    continue
                if owner in new_owners:
                    ShapeOwner.create(shape=shape, user=User.by_name(owner))
                else:
                    ShapeOwner.get(
                        shape=shape, user=User.by_name(owner)
                    ).delete_instance(True)

    # Send to players
    if layer.player_visible:
        for room_player in room.players:
            for psid in state.get_sids(room_player.player, room):
                if psid == sid:
                    continue
                if not data["temporary"]:
                    data["shape"] = shape.as_dict(room_player.player, False)
                await sio.emit("Shape.Update", data, room=psid, namespace="/planarally")

    # Send to DM
    for csid in state.get_sids(room.creator, room):
        if csid == sid:
            continue
        if not data["temporary"]:
            data["shape"] = shape.as_dict(room.creator, True)
        await sio.emit("Shape.Update", data, room=csid, namespace="/planarally")


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
        layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]
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
        shape.delete_instance()

    if layer.player_visible:
        await sio.emit(
            "Shape.Remove",
            data["shape"],
            room=location.get_path(),
            skip_sid=sid,
            namespace="/planarally",
        )
    else:
        for csid in state.get_sids(room.creator, room):
            if csid == sid:
                continue
            await sio.emit(
                "Shape.Remove", data["shape"], room=csid, namespace="/planarally"
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

    layer = Layer.get(location=location, name=data["layer"])
    shape = Shape.get(uuid=data["uuid"])
    shape.layer = layer
    shape.save()

    await sio.emit(
        "Shape.Layer.Change",
        data,
        room=location.get_path(),
        skip_sid=sid,
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

    target = data["index"] + 1
    sign = 1 if target <= 1 else -1
    polarity = 1 if shape.index > 0 else -1
    case = Case(
        None,
        (
            (Shape.index == shape.index, target * (-polarity)),
            (
                (polarity * sign * Shape.index) < (polarity * sign * shape.index),
                (Shape.index + (polarity * sign * 1)) * -1,
            ),
        ),
        Shape.index * -1,
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
        for csid in state.get_sids(room.creator, room):
            if csid == sid:
                continue
            await sio.emit(
                "Shape.Order.Set", data["shape"], room=csid, namespace="/planarally"
            )
