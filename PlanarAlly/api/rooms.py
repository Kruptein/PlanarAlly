import auth
from app import app, logger, sio
from models import LocationUserOption, Layer


@auth.login_required(app, sio)
async def load_location(sid, location):
    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    room = policy.sid_map[sid]['room']

    policy.sid_map[sid]['location'] = location

    data = {}
    data['locations'] = [l.name for l in room.locations]
    data['layers'] = [l.as_dict(user, user == room.creator) for l in location.layers.order_by(Layer.index).where(Layer.player_visible)]

    await sio.emit('Board.Set', data, room=sid, namespace='/planarally')
    await sio.emit("Location.Set", location.as_dict(), room=sid, namespace='/planarally')
    await sio.emit("Client.Options.Set", LocationUserOption.get(user=user, location=location).as_dict(), room=sid, namespace='/planarally')
    # if hasattr(location, "initiative"):
    #     initiatives = location.initiative
    #     if room.creator != username:
    #         initiatives = []
    #         for i in location.initiative:
    #             shape = location.layer_manager.get_shape(i['uuid'])
    #             if shape and username in shape.get('owners', []) or i.get("visible", False):
    #                 initiatives.append(i)
    #     await sio.emit("Initiative.Set", initiatives, room=sid, namespace='/planarally')
    #     if hasattr(location, "initiativeRound"):
    #         await sio.emit("Initiative.Round.Update", location.initiativeRound, room=sid, namespace='/planarally')
    #     if hasattr(location, "initiativeTurn"):
    #         await sio.emit("Initiative.Turn.Update", location.initiativeTurn, room=sid, namespace='/planarally')


@sio.on("Location.Change", namespace='/planarally')
async def change_location(sid, location):
    policy = app['AuthzPolicy']
    username = policy.sid_map[sid]['user'].name
    room = policy.sid_map[sid]['room']

    if room.creator != username:
        logger.warning(f"{username} attempted to change location")
        return

    old_location = room.get_active_location(username)
    sio.leave_room(sid, old_location.sioroom, namespace='/planarally')
    room.dm_location = location
    new_location = room.get_active_location(username)

    sio.enter_room(sid, new_location.sioroom, namespace='/planarally')
    await load_location(sid, new_location)

    room.player_location = location

    for player in room.players:
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            sio.leave_room(psid, old_location.sioroom, namespace='/planarally')
            sio.enter_room(psid, new_location.sioroom, namespace='/planarally')
            await load_location(psid, new_location)


@sio.on("Location.Options.Set", namespace='/planarally')
@auth.login_required(app, sio)
async def set_room(sid, data):
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warning(f"{username} attempted to set a room option")
        return

    location.options.update(**data)
    await sio.emit("Location.Options.Set", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Location.New", namespace='/planarally')
async def add_new_location(sid, location):
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']

    if room.creator != username:
        logger.warning(f"{username} attempted to add a new location")
        return

    room.add_new_location(location)
    new_location = room.get_active_location(username)

    sio.leave_room(sid, new_location.sioroom, namespace='/planarally')
    room.dm_location = location
    sio.enter_room(sid, new_location.sioroom, namespace='/planarally')
    PA.save_room(room)
    await sio.emit('Board.Set', room.get_board(username), room=sid, namespace='/planarally')
    await sio.emit("Location.Set", {'options': new_location.options, 'name': new_location.name}, room=sid,
                   namespace='/planarally')
    await sio.emit("Client.Options.Set", app['AuthzPolicy'].user_map[username].options, room=sid,
                   namespace='/planarally')
