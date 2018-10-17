from urllib.parse import unquote

from aiohttp_security import authorized_userid

from api.rooms import load_location
from app import sio, logger, app
from models import Location, Room, User


@sio.on('connect', namespace='/planarally')
async def connect(sid, environ):
    user = await authorized_userid(environ['aiohttp.request'])
    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace='/planarally')
    else:
        ref = unquote(environ['HTTP_REFERER']).strip("/").split("/")
        room = Room.select().join(User).where(
            (Room.name == ref[-1]) & (User.name == ref[-2]))[0]
        if room.creator == user:
            location = Location.get(room=room, name=room.dm_location)
        else:
            location = Location.get(room=room, name=room.player_location)

        policy = app['AuthzPolicy']

        policy.sid_map[sid] = {
            'user': user,
            'room': room,
            'location': location,
        }
        logger.info(f"User {user.name} connected with identifier {sid}")

        # TODO
        # assets = policy.user_map[username].asset_info

        sio.enter_room(sid, location.get_path(), namespace='/planarally')
        await sio.emit("Username.Set", user.name, room=sid, namespace='/planarally')
        await sio.emit("Room.Info.Set", {'name': room.name, 'creator': room.creator.name, 'invitationCode': str(room.invitation_code)}, room=sid, namespace='/planarally')
        # await sio.emit("Notes.Set", room.get_notes(username), room=sid, namespace='/planarally')
        # await sio.emit('Asset.List.Set', assets, room=sid, namespace='/planarally')
        await load_location(sid, location)


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    if sid not in app['AuthzPolicy'].sid_map:
        return
    username = app['AuthzPolicy'].sid_map[sid]['user'].name
    room = app['AuthzPolicy'].sid_map[sid]['room']
    location = room.get_active_location(username)

    logger.info(f'User {username} disconnected with identifier {sid}')
    del app['AuthzPolicy'].sid_map[sid]

    if sid in location.client_temporaries:
        await sio.emit("Temp.Clear", location.client_temporaries[sid])
        del location.client_temporaries[sid]


@sio.on('connect', namespace='/pa_assetmgmt')
async def assetmgmt_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace='/pa_assetmgmt')
    else:
        app['AuthzPolicy'].sid_map[sid] = {
            'user': app['AuthzPolicy'].user_map[username],
        }
        await sio.emit("assetInfo", app['AuthzPolicy'].user_map[username].asset_info, room=sid, namespace='/pa_assetmgmt')