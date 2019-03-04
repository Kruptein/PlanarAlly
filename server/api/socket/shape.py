from datetime import datetime
from peewee import Case
from playhouse.shortcuts import update_model_from_dict

import auth
from .initiative import send_client_initiatives
from app import app, logger, sio, state
from models import (
    Aura,
    Label,
    Layer,
    PlayerRoom,
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
            data["shape"]["index"] = layer.shapes.count()
            # Shape itself
            shape = Shape.create(**reduce_data_to_model(Shape, data["shape"]))
            # Subshape
            type_table = get_table(shape.type_)
            type_table.create(**reduce_data_to_model(type_table, data["shape"]))
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
            data["shape"]["layer"] = Layer.get(
                location=location, name=data["shape"]["layer"]
            )
            # Shape
            model = reduce_data_to_model(Shape, data["shape"])
            update_model_from_dict(shape, model)
            shape.save()
            if shape.type_ in ["polygon", "multiline"]:
                # Subshape
                type_table = get_table(shape.type_)
                type_instance = type_table.get(uuid=shape.uuid)
                # no backrefs on these tables
                update_model_from_dict(
                    type_instance, data["shape"], ignore_unknown=True
                )
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
            data["shape"]["layer"] = Layer.get(
                location=location, name=data["shape"]["layer"]
            )
            # Shape
            update_model_from_dict(shape, reduce_data_to_model(Shape, data["shape"]))
            shape.save()
            # Subshape
            type_table = get_table(shape.type_)
            type_instance = type_table.get(uuid=shape.uuid)
            # no backrefs on these tables
            update_model_from_dict(type_instance, data["shape"], ignore_unknown=True)
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
            for tracker in data["shape"]["trackers"]:
                tracker_db = Tracker.get_or_none(uuid=tracker["uuid"])
                reduced = reduce_data_to_model(Tracker, tracker)
                reduced["shape"] = shape
                if tracker_db:
                    update_model_from_dict(tracker_db, reduced)
                    tracker_db.save()
                else:
                    Tracker.create(**reduced)
            # Auras
            for aura in data["shape"]["auras"]:
                aura_db = Aura.get_or_none(uuid=aura["uuid"])
                reduced = reduce_data_to_model(Aura, aura)
                reduced["shape"] = shape
                if aura_db:
                    update_model_from_dict(aura_db, reduced)
                    aura_db.save()
                else:
                    Aura.create(**reduced)
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
                    ShapeLabel.get(uuid=label, shape=shape).delete_instance(True)

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


async def sync_shape_update(layer, room, data, sid, shape):
    # Send to players
    # if layer.player_visible:
    # for room_player in room.players:
    for psid, player in state.get_players(room=room):
        if psid == sid:
            continue
        if not data["temporary"]:
            data["shape"] = shape.as_dict(player, False)
        await sio.emit("Shape.Update", data, room=psid, namespace="/planarally")
    #     for player in User.select(User).join(PlayerRoom).where(PlayerRoom.room == room):
    #         for psid in state.get_sids(user=player, room=room):
    #             if psid == sid:
    #                 continue
    #             if not data["temporary"]:
    #                 data["shape"] = shape.as_dict(player, False)
    #             await sio.emit("Shape.Update", data, room=psid, namespace="/planarally")

    # # Send to DM
    # for csid in state.get_sids(user=room.creator, room=room):
    #     if csid == sid:
    #         continue
    #     if not data["temporary"]:
    #         data["shape"] = shape.as_dict(room.creator, True)
    #     await sio.emit("Shape.Update", data, room=csid, namespace="/planarally")


async def _get_shape(data, location, user):
    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # This stuff is not stored so we cannot do any server side validation /shrug
        shape = data["shape"]
        layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]
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
