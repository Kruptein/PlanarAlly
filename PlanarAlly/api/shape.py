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
    Shape.update(index=case).where(Shape.layer == layer).execute()
    layer.shapes.move_to_end(data["shape"]["uuid"], data["index"] != 0)
    if layer.player_visible:
        await sio.emit(
            "Shape.Order.Set",
            data,
            room=location.sioroom,
            skip_sid=sid,
            namespace="/planarally",
        )


@sio.on("Shape.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_shape(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room = sid_data["room"]
    location = sid_data["location"]

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data["temporary"]:
        # orig_shape = data[
        #     "shape"
        # ]  # This stuff is not stored so we cannot do any server side validation /shrug
        pass
    else:
        orig_shape = Shape.get(uuid=data["shape"]["uuid"])
        layer = orig_shape.layer

    if room.creator != user.name:
        if not layer.player_editable:
            logger.warning(f"{user.name} attempted to move a shape on a dm layer")
            return
        # Use the server version of the shape.
        if not ShapeOwner.get_or_none(shape=orig_shape, user=user):
            logger.warning(f"{user.name} attempted to move asset it does not own")
            return

    # Overwrite the old data with the new data
    if not data["temporary"]:
        update_model_from_dict(orig_shape, data["shape"])
        orig_shape.save()

    if layer.player_visible:
        for player in room.players:
            for psid in state.get_sids(player.user, room):
                if psid == sid:
                    continue
                await sio.emit(
                    "Shape.Move",
                    orig_shape.as_dict(player.user, False),
                    room=psid,
                    namespace="/planarally",
                )

    for csid in state.get_sids(room.creator, room):
        if csid == sid:
            continue
        await sio.emit(
            "Shape.Move",
            orig_shape.as_dict(room.creator, True),
            room=csid,
            namespace="/planarally",
        )
