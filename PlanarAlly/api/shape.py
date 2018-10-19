from peewee import Case
from playhouse.shortcuts import dict_to_model, update_model_from_dict

import auth
from app import sio, app, logger, state


@sio.on("Shape.Add", namespace="/planarally")
@auth.login_required(app, sio)
async def add_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]

    if room.creator != user.name and not layer.player_editable:
        logger.warning(f"{user.name} attempted to add a shape to a dm layer")
        return
    if data["temporary"]:
        state.add_temp(sid, data["shape"]["uuid"])
    else:
        shape = Shape.create(**data["shape"]["uuid"])
    if layer.player_visible:
        for player in room.players:
            if player == username:
                continue
            psid = policy.get_sid(policy.user_map[player], room)
            if psid is not None:
                await sio.emit(
                    "Shape.Add",
                    shape_wrap(player, data["shape"]),
                    room=psid,
                    namespace="/planarally",
                )

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit(
                "Shape.Add", data["shape"], room=croom, namespace="/planarally"
            )


@sio.on("Shape.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def remove_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    layer = location.layers.where(Layer.name == data["shape"]["layer"])[0]

    if data["temporary"]:
        # orig_shape = dict_to_model(data[
        #     "shape"
        # ]  # This stuff is not stored so we cannot do any server side validation /shrug
        pass
    else:
        orig_shape = Shape.get(uuid=data["shape"]["uuid"])

    if room.creator != user.name:
        if not layer.player_editable:
            logger.warning(f"{user.name} attempted to remove a shape from a dm layer")
            return
        if not ShapeOwner.get_or_none(shape=orig_shape, user=user):
            logger.warning(f"{user.name} attempted to remove a shape it does not own")
            return

    if data["temporary"]:
        state.remove_temp(sid, data["shape"]["uuid"])
    else:
        orig_shape.delete_instance()
    if layer.player_visible:
        await sio.emit(
            "Shape.Remove",
            data["shape"],
            room=location.sioroom,
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

    if room.creator != user.name and not layer.player_editable:
        logger.warning(f"{user.name} attempted to move a shape order on a dm layer")
        return

    target = data["index"]
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
    Shape.update(index=case).where(Shape.layer == layer)
    layer.shapes.move_to_end(data["shape"]["uuid"], data["index"] != 0)
    if layer.player_visible:
        await sio.emit(
            "Shape.Order.Set",
            data,
            room=location.sioroom,
            skip_sid=sid,
            namespace="/planarally",
        )


@sio.on("Shape.Move", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)

    if "layer" not in data["shape"]:
        logger.critical(f"Shape {data['shape']} does not have a layer associated")
        return

    layer = location.layer_manager.get_layer(data["shape"]["layer"])

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        orig_shape = data[
            "shape"
        ]  # This stuff is not stored so we cannot do any server side validation /shrug
    else:
        orig_shape = layer.shapes[data["shape"]["uuid"]]

    if room.creator != username:
        if not layer.player_editable:
            logger.warning(f"{username} attempted to move a shape on a dm layer")
            return
        # Use the server version of the shape.
        if username not in orig_shape["owners"]:
            logger.warning(f"{username} attempted to move asset it does not own")
            return

    # Overwrite the old data with the new data
    if not data["temporary"]:
        layer.shapes[data["shape"]["uuid"]] = data["shape"]

    if layer.player_visible:
        for player in room.players:
            if player == username:
                continue
            psid = policy.get_sid(policy.user_map[player], room)
            if psid is not None:
                await sio.emit(
                    "Shape.Move",
                    shape_wrap(player, data["shape"]),
                    room=psid,
                    namespace="/planarally",
                )

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit(
                "Shape.Move", data["shape"], room=croom, namespace="/planarally"
            )


def shape_wrap(player, shape):
    """
    Helper function to make sure only data that the given player is allowed to see is sent.
    """
    pl_shape = dict(shape)
    if "annotation" in pl_shape and player not in pl_shape["owners"]:
        del pl_shape["annotation"]
    pl_shape["trackers"] = [
        t for t in shape["trackers"] if player in pl_shape["owners"] or t["visible"]
    ]
    pl_shape["auras"] = [
        a for a in shape["auras"] if player in pl_shape["owners"] or a["visible"]
    ]
    return pl_shape


@sio.on("Shape.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_shape(sid, data):
    policy = app["AuthzPolicy"]
    username = policy.sid_map[sid]["user"].name
    room = policy.sid_map[sid]["room"]
    location = room.get_active_location(username)
    layer = location.layer_manager.get_layer(data["shape"]["layer"])

    orig_shape = layer.shapes[data["shape"]["uuid"]]

    if room.creator != username:
        if username not in orig_shape["owners"]:
            logger.warning(f"{username} attempted to change asset it does not own")
            return

    layer.shapes[data["shape"]["uuid"]] = data["shape"]

    for player in room.players:
        if player == username:
            continue
        pl_data = dict(data)
        pl_data["shape"] = shape_wrap(player, data["shape"])
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            await sio.emit("Shape.Update", pl_data, room=psid, namespace="/planarally")

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("Shape.Update", data, room=croom, namespace="/planarally")

