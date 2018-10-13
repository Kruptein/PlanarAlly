"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import asyncio
import collections
import configparser
import functools
import hashlib
import logging
import os
import sys
from operator import itemgetter
from pathlib import Path
from urllib.parse import unquote

import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
import socketio
from aiohttp import web
from aiohttp_security import remember, forget, authorized_userid, login_required, SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
import save
from planarally import PlanarAlly

if getattr(sys, "frozen", False):
    FILE_DIR = Path(sys.executable).resolve().parent
else:
    FILE_DIR = Path(__file__).resolve().parent

os.chdir(FILE_DIR)

cfg = configparser.ConfigParser()
cfg.read("server_config.cfg")

SAVE_FILE = cfg['General']['save_file']

logger = logging.getLogger('PlanarAllyServer')
logger.setLevel(logging.INFO)
fh = logging.FileHandler(FILE_DIR / 'planarallyserver.log')
fh.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)')
fh.setFormatter(formatter)
logger.addHandler(fh)
logger.addHandler(logging.StreamHandler(sys.stdout))

PENDING_FILE_UPLOAD_CACHE = {}

ASSETS_DIR = FILE_DIR / "static" / "assets"
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir()

save.check_save(SAVE_FILE)

PA = PlanarAlly(SAVE_FILE)

sio = socketio.AsyncServer(async_mode='aiohttp', engineio_logger=False)
app = web.Application()
app["AuthzPolicy"] = auth.ShelveDictAuthorizationPolicy(SAVE_FILE)
aiohttp_security.setup(app, SessionIdentityPolicy(), app['AuthzPolicy'])
aiohttp_session.setup(app, EncryptedCookieStorage(app['AuthzPolicy'].secret_token))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
sio.attach(app)

# This is a fix for asyncio problems on windows that make it impossible to do ctrl+c
if sys.platform.startswith("win"):
    def _wakeup():
        asyncio.get_event_loop().call_later(0.1, _wakeup)

    asyncio.get_event_loop().call_later(0.1, _wakeup)


def nested_dict_update(d, u):
    for k, v in u.items():
        if isinstance(v, collections.Mapping):
            d[k] = nested_dict_update(d.get(k, {}), v)
        else:
            d[k] = v
    return d


async def on_shutdown(app):
    app['background_save'].cancel()
    PA.save()
    for sid in list(app['AuthzPolicy'].sio_map.keys()):
        await sio.disconnect(sid, namespace='/planarally')


async def save_all():
    while True:
        await sio.sleep(5 * 60)
        PA.save()


@aiohttp_jinja2.template("login.jinja2")
async def login(request):
    username = await authorized_userid(request)
    if username:
        return web.HTTPFound("/rooms")
    else:
        valid = False
        if request.method == 'POST':
            policy = app['AuthzPolicy']
            data = await request.post()
            username = data['username']
            password = data['password']
            form = {'username': username, 'password': password}
            if 'register' in data:
                if username in policy.user_map:
                    form['error'] = "Username already taken"
                elif not username:
                    form['error'] = "Please provide a username"
                elif not password:
                    form['error'] = "Please provide a password"
                else:
                    u = auth.User(username)
                    u.set_password(password)
                    policy.user_map[username] = u
                    app['AuthzPolicy'].save()
                    valid = True
            elif 'login' in data:
                if username not in policy.user_map or not policy.user_map[username].check_password(password):
                    form['error'] = "Username and/or Password do not match"
                else:
                    valid = True
            if valid:
                response = web.HTTPFound("/rooms")
                await remember(request, response, username)
                return response
            return form
        else:
            return {'username': '', 'password': ''}


@login_required
async def logout(request):
    response = web.HTTPFound("/")
    await forget(request, response)
    return response


@login_required
@aiohttp_jinja2.template('rooms.jinja2')
async def show_rooms(request):
    username = await authorized_userid(request)
    owned, joined = PA.get_rooms(username)
    return {'owned': owned, 'joined': joined}


@login_required
async def create_room(request):
    username = await authorized_userid(request)
    data = await request.post()
    roomname = data['room_name']
    if not roomname:
        response = web.HTTPFound('/rooms')
    else:
        PA.add_room(roomname, username)
        response = web.HTTPFound(f'/rooms/{username}/{roomname}')
    return response


@login_required
@aiohttp_jinja2.template('planarally.jinja2')
async def show_room(request):
    username = await authorized_userid(request)
    try:
        room = PA.rooms[(request.match_info['roomname'], request.match_info['username'])]
    except KeyError:
        pass
    else:
        if room.creator == username:
            return {'dm': True}
        if username in room.players:
            return {'dm': False}
    return web.HTTPFound("/rooms")


@login_required
async def claim_invite(request):
    username = await authorized_userid(request)
    try:
        room = PA.get_room_from_invite(request.match_info['code'])
    except KeyError:
        return web.HTTPNotFound()
    else:
        if username != room.creator and username not in room.players:
            room.players.append(username)
            PA.save_room(room)
        return web.HTTPFound(f"/rooms/{room.creator}/{room.name}")


@login_required
@aiohttp_jinja2.template('assets.jinja2')
async def show_assets(request):
    pass


# SOCKETS
@sio.on("Shape.Add", namespace="/planarally")
@auth.login_required(app, sio)
async def add_shape(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])

    if room.creator != username and not layer.player_editable:
        logger.warn(f"{username} attempted to add a shape to a dm layer")
        return
    if data['temporary']:
        location.add_temp(sid, data['shape']['uuid'])
    else:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        for player in room.players:
            if player == username:
                continue
            psid = policy.get_sid(policy.user_map[player], room)
            if psid is not None:
                await sio.emit("Shape.Add", shape_wrap(player, data['shape']), room=psid, namespace='/planarally')

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("Shape.Add", data['shape'], room=croom, namespace='/planarally')


@sio.on("Shape.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def remove_shape(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])

    if data['temporary']:
        orig_shape = data['shape']  # This stuff is not stored so we cannot do any server side validation /shrug
    else:
        orig_shape = layer.shapes[data['shape']['uuid']]

    if room.creator != username:
        if not layer.player_editable:
            logger.warn(f"{username} attempted to remove a shape from a dm layer")
            return
        if username not in orig_shape['owners']:
            logger.warn(f"{username} attempted to remove a shape it does not own")
            return

    if data['temporary']:
        location.client_temporaries[sid].remove(data['shape']['uuid'])
    else:
        del layer.shapes[data['shape']['uuid']]
    if layer.player_visible:
        await sio.emit("Shape.Remove", data['shape'], room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Shape.Order.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape_order(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        logger.warn(f"{username} attempted to move a shape order on a dm layer")
        return
    layer.shapes.move_to_end(data['shape']['uuid'], data['index'] != 0)
    if layer.player_visible:
        await sio.emit("Shape.Order.Set", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Shape.Move", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    if 'layer' not in data['shape']:
        logger.critical(f"Shape {data['shape']} does not have a layer associated")
        return

    layer = location.layer_manager.get_layer(data['shape']['layer'])

    # We're first gonna retrieve the existing server side shape for some validation checks
    if data['temporary']:
        orig_shape = data['shape']  # This stuff is not stored so we cannot do any server side validation /shrug
    else:
        orig_shape = layer.shapes[data['shape']['uuid']]

    if room.creator != username:
        if not layer.player_editable:
            logger.warn(f"{username} attempted to move a shape on a dm layer")
            return
        # Use the server version of the shape.
        if username not in orig_shape['owners']:
            logger.warn(f"{username} attempted to move asset it does not own")
            return
    
    # Overwrite the old data with the new data
    if not data['temporary']:
        layer.shapes[data['shape']['uuid']] = data['shape']
    
    if layer.player_visible:
        for player in room.players:
            if player == username:
                continue
            psid = policy.get_sid(policy.user_map[player], room)
            if psid is not None:
                await sio.emit("Shape.Move", shape_wrap(player, data['shape']), room=psid, namespace='/planarally')
    
    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("Shape.Move", data['shape'], room=croom, namespace='/planarally')


def shape_wrap(player, shape):
    """
    Helper function to make sure only data that the given player is allowed to see is sent.
    """
    pl_shape = dict(shape)
    if 'annotation' in pl_shape and player not in pl_shape['owners']:
        del pl_shape['annotation']
    pl_shape['trackers'] = [t for t in shape['trackers'] if player in pl_shape['owners'] or t['visible']]
    pl_shape['auras'] = [a for a in shape['auras'] if player in pl_shape['owners'] or a['visible']]
    return pl_shape


@sio.on("Shape.Update", namespace='/planarally')
@auth.login_required(app, sio)
async def update_shape(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)
    layer = location.layer_manager.get_layer(data['shape']['layer'])

    orig_shape = layer.shapes[data['shape']['uuid']]

    if room.creator != username:
        if username not in orig_shape['owners']:
            logger.warn(f"{username} attempted to change asset it does not own")
            return

    layer.shapes[data['shape']['uuid']] = data['shape']

    for player in room.players:
        if player == username:
            continue
        pl_data = dict(data)
        pl_data['shape'] = shape_wrap(player, data['shape'])
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            await sio.emit("Shape.Update", pl_data, room=psid, namespace='/planarally')

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("Shape.Update", data, room=croom, namespace='/planarally')


@sio.on("Initiative.Update", namespace='/planarally')
@auth.login_required(app, sio)
async def update_initiative(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    if not hasattr(location, "initiative"):
        location.initiative = []

    shape = location.layer_manager.get_shape(data['uuid'])

    if room.creator != username:
        if username not in shape['owners']:
            logger.warn(f"{username} attempted to change initiative of an asset it does not own")
            return

    removed = False
    used_to_be_visible = False

    for init in list(location.initiative):
        if init['uuid'] == data['uuid']:
            if "initiative" not in data:
                removed = True
                location.initiative.remove(init)
            else:
                used_to_be_visible = init.get("visible", False)
                init.update(**data)
            break
    else:
        location.initiative.append(data)
    location.initiative.sort(key=itemgetter('initiative'), reverse=True)

    for player in room.players:
        if player == username:
            continue

        if not removed and not used_to_be_visible and not data['visible']:
            continue

        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            await sio.emit("Initiative.Update", data, room=psid, namespace='/planarally')

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("Initiative.Update", data, room=croom, namespace='/planarally')


@sio.on("Initiative.Set", namespace='/planarally')
@auth.login_required(app, sio)
async def update_initiative_order(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warn(f"{username} attempted to change the initiative order")
        return
    
    location.initiative = [d for d in data if d]
    initiatives = location.initiative
    if room.creator != username:
        initiatives = []
        for i in location.initiative:
            shape = location.layer_manager.get_shape(i['uuid'])
            if shape and username in shape.get('owners', []) or i.get("visible", False):
                initiatives.append(i)
    await sio.emit("Initiative.Set", initiatives, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Initiative.Turn.Update", namespace='/planarally')
@auth.login_required(app, sio)
async def update_initiative_turn(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warn(f"{username} attempted to advance the initiative tracker")
        return
    
    location.initiativeTurn = data
    for init in location.initiative:
        if init['uuid'] == data:
            for eff in list(init['effects']):
                if eff['turns'] <= 0:
                    init['effects'].remove(eff)
                else:
                    eff['turns'] -= 1

    await sio.emit("Initiative.Turn.Update", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Initiative.Round.Update", namespace='/planarally')
@auth.login_required(app, sio)
async def update_initiative_round(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warn(f"{username} attempted to advance the initiative tracker")
        return
    
    location.initiativeRound = data

    await sio.emit("Initiative.Round.Update", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Initiative.Effect.New", namespace='/planarally')
@auth.login_required(app, sio)
async def new_initiative_effect(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    shape = location.layer_manager.get_shape(data['actor'])

    if room.creator != username:
        if username not in shape['owners']:
            logger.warn(f"{username} attempted to create a new initiative effect")
            return
    
    for init in location.initiative:
        if init['uuid'] == data['actor']:
            if 'effects' not in init:
                init['effects'] = []
            init['effects'].append(data['effect'])
    
    await sio.emit("Initiative.Effect.New", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Initiative.Effect.Update", namespace='/planarally')
@auth.login_required(app, sio)
async def update_initiative_effect(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    shape = location.layer_manager.get_shape(data['actor'])

    if room.creator != username:
        if username not in shape['owners']:
            logger.warn(f"{username} attempted to update an initiative effect")
            return
    
    for init in location.initiative:
        if init['uuid'] == data['actor']:
            for i, eff in enumerate(init['effects']):
                if eff['uuid'] == data['effect']['uuid']:
                    init['effects'][i] = data['effect']
    
    await sio.emit("Initiative.Effect.Update", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')

@sio.on("Client.Options.Set", namespace='/planarally')
@auth.login_required(app, sio)
async def set_client(sid, data):
    user = app['AuthzPolicy'].sio_map[sid]['user']
    nested_dict_update(user.options, data)
    app['AuthzPolicy'].save()


@sio.on("Location.Options.Set", namespace='/planarally')
@auth.login_required(app, sio)
async def set_room(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warn(f"{username} attempted to set a room option")
        return

    location.options.update(**data)
    await sio.emit("Location.Options.Set", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("Gridsize.Set", namespace="/planarally")
@auth.login_required(app, sio)
async def set_gridsize(sid, grid_size):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        logger.warn(f"{username} attempted to set gridsize without DM rights")
        return
    location.layer_manager.get_grid_layer().size = grid_size
    await sio.emit("Gridsize.Set", grid_size, room=location.sioroom, skip_sid=sid, namespace="/planarally")


@sio.on("Note.New", namespace="/planarally")
@auth.login_required(app, sio)
async def new_note(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if data["uuid"] in room.notes:
        logger.warn(f"{username} tried to overwrite existing note with id: '{data['uuid']}'")
        return

    room.add_new_note(data, username)
    PA.save_room(room)


@sio.on("Note.Update", namespace="/planarally")
@auth.login_required(app, sio)
async def update_note(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if data["uuid"] not in room.notes:
        logger.warn(f"{username} tried to update non-existant note with id: '{data['uuid']}'")
        return

    room.update_note(data, username)
    PA.save_room(room)


@sio.on("Note.Remove", namespace="/planarally")
@auth.login_required(app, sio)
async def delete_note(sid, uuid):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if uuid not in room.notes:
        logger.warn(f"{username} tried to remove non-existant note with id: '{uuid}'")
        return

    room.delete_note(uuid, username)
    PA.save_room(room)


@sio.on("Location.New", namespace='/planarally')
async def add_new_location(sid, location):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if room.creator != username:
        logger.warn(f"{username} attempted to add a new location")
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


@sio.on("Location.Change", namespace='/planarally')
async def change_location(sid, location):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']

    if room.creator != username:
        logger.warn(f"{username} attempted to change location")
        return

    old_location = room.get_active_location(username)
    sio.leave_room(sid, old_location.sioroom, namespace='/planarally')
    room.dm_location = location
    new_location = room.get_active_location(username)
    
    sio.enter_room(sid, new_location.sioroom, namespace='/planarally')
    await load_location(sid, new_location)

    room.player_location = location
    PA.save_room(room)

    for player in room.players:
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            sio.leave_room(psid, old_location.sioroom, namespace='/planarally')
            sio.enter_room(psid, new_location.sioroom, namespace='/planarally')
            await load_location(psid, new_location)


async def load_location(sid, location):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']

    await sio.emit('Board.Set', room.get_board(username), room=sid, namespace='/planarally')
    await sio.emit("Location.Set", {'options': location.options, 'name': location.name}, room=sid, namespace='/planarally')
    await sio.emit("Client.Options.Set", app['AuthzPolicy'].user_map[username].options, room=sid, namespace='/planarally')
    if hasattr(location, "initiative"):
        initiatives = location.initiative
        if room.creator != username:
            initiatives = []
            for i in location.initiative:
                shape = location.layer_manager.get_shape(i['uuid'])
                if shape and username in shape.get('owners', []) or i.get("visible", False):
                    initiatives.append(i)
        await sio.emit("Initiative.Set", initiatives, room=sid, namespace='/planarally')
        if hasattr(location, "initiativeRound"):
            await sio.emit("Initiative.Round.Update", location.initiativeRound, room=sid, namespace='/planarally')
        if hasattr(location, "initiativeTurn"):
            await sio.emit("Initiative.Turn.Update", location.initiativeTurn, room=sid, namespace='/planarally')


@sio.on("Players.Bring", namespace='/planarally')
async def bring_players(sid, data):
    policy = app['AuthzPolicy']
    room = policy.sio_map[sid]['room']
    for player in room.players:
        user = policy.user_map[player]
        await sio.emit("Position.Set", data, room=policy.get_sid(user, room), namespace='/planarally')

@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace='/planarally')
    else:
        ref = unquote(environ['HTTP_REFERER']).strip("/").split("/")
        room = PA.rooms[(ref[-1], ref[-2])]
        location = room.get_active_location(username)

        policy = app['AuthzPolicy']

        policy.sio_map[sid] = {
            'user': policy.user_map[username],
            'room': room
        }
        logger.info(f"User {username} connected with identifier {sid}")

        assets = policy.user_map[username].asset_info

        sio.enter_room(sid, location.sioroom, namespace='/planarally')
        await sio.emit("Username.Set", username, room=sid, namespace='/planarally')
        await sio.emit("Room.Info.Set", {'name': room.name, 'creator': room.creator, 'invitationCode': str(room.invitation_code)}, room=sid, namespace='/planarally')
        await sio.emit("Notes.Set", room.get_notes(username), room=sid, namespace='/planarally')
        await sio.emit('Asset.List.Set', assets, room=sid, namespace='/planarally')
        await load_location(sid, location)


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    if sid not in app['AuthzPolicy'].sio_map:
        return
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    logger.info(f'User {username} disconnected with identifier {sid}')
    del app['AuthzPolicy'].sio_map[sid]

    if sid in location.client_temporaries:
        await sio.emit("Temp.Clear", location.client_temporaries[sid])
        del location.client_temporaries[sid]

    PA.save_room(room)


@sio.on('connect', namespace='/pa_assetmgmt')
async def assetmgmt_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace='/pa_assetmgmt')
    else:
        app['AuthzPolicy'].sio_map[sid] = {
            'user': app['AuthzPolicy'].user_map[username],
        }
        await sio.emit("assetInfo", app['AuthzPolicy'].user_map[username].asset_info, room=sid, namespace='/pa_assetmgmt')


@sio.on('Asset.Upload', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_upload(sid, file_data):
    filename = file_data['name']
    uuid = file_data['uuid']

    global PENDING_FILE_UPLOAD_CACHE
    if uuid not in PENDING_FILE_UPLOAD_CACHE:
        PENDING_FILE_UPLOAD_CACHE[uuid] = {}
    PENDING_FILE_UPLOAD_CACHE[uuid][file_data['slice']] = file_data
    if len(PENDING_FILE_UPLOAD_CACHE[uuid]) != file_data['totalSlices']:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b''
    for slice in range(file_data['totalSlices']):
        data += PENDING_FILE_UPLOAD_CACHE[uuid][slice]['data']
    
    sha1 = hashlib.sha1()
    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    if not (ASSETS_DIR / hashname).exists():
        with open(ASSETS_DIR / hashname, "wb") as f:
            f.write(data)
    
    del PENDING_FILE_UPLOAD_CACHE[uuid]
    
    policy = app['AuthzPolicy']
    user = policy.sio_map[sid]['user']
    folder = functools.reduce(dict.get, file_data['directory'], user.asset_info)
    if folder is None:
        logger.warn(f"Directory structure {file_data['directory']} is not valid for {user.username}")
        return

    file_info = {'name': file_data['name'], 'hash': hashname}
    if '__files' not in folder:
        folder['__files'] = []
    folder['__files'].append(file_info)

    policy.save()

    await sio.emit("Asset.Upload.Finish", {"fileInfo": file_info, "directory": file_data['directory']}, room=sid, namespace='/pa_assetmgmt')


@sio.on('Asset.Directory.New', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_mkdir(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sio_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    folder[data['name']] = {'__files': []}
    policy.save()


@sio.on('Asset.Rename', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_rename(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sio_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['isFolder']:
        folder[data['newName']] = folder[data['oldName']]
        del folder[data['oldName']]
    else:
        for fl in folder['__files']:
            if fl['name'] == data['oldName']:
                fl['name'] = data['newName']
    policy.save()


@sio.on("Inode.Move", namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_mv(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sio_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['target'] == '..':
        target_directory = data['directory'][:-1]
    else:
        target_directory = data['directory'] + [data['target']]
    target_folder = functools.reduce(dict.get, target_directory, user.asset_info)
    name = data['inode'] if data['isFolder'] else data['inode']['name']
    if data['isFolder']:
        target_folder[name] = folder[name]
        del folder[name]
    else:
        if not target_folder['__files']:
            target_folder['__files'] = []
        target_folder['__files'].append(data['inode'])
        folder['__files'] = [ fl for fl in folder['__files'] if fl['hash'] != data['inode']['hash'] ]
    policy.save()


@sio.on('Asset.Remove', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_rm(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sio_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['isFolder'] and data['name'] in folder:
        del folder[data['name']]
    else:
        index = next((i for i, fl in enumerate(folder['__files']) if fl['name'] == data['name']), None)
        if index is not None:
            folder['__files'].pop(index);
    policy.save()


app.router.add_static('/static', 'static')
app.router.add_route('*', '/', login)
app.router.add_get('/rooms', show_rooms)
app.router.add_get('/rooms/{username}/{roomname}', show_room)
app.router.add_get('/invite/{code}', claim_invite)
app.router.add_post('/create_room', create_room)
app.router.add_get('/assets/', show_assets)
app.router.add_get('/logout', logout)

app.on_shutdown.append(on_shutdown)

if __name__ == '__main__':
    app['background_save'] = sio.start_background_task(save_all)
    if cfg.getboolean('Webserver', 'ssl'):
        import ssl

        ctx = ssl.SSLContext()
        ctx.load_cert_chain(
            cfg['Webserver']['ssl_fullchain'],
            cfg['Webserver']['ssl_privkey']
        )
        web.run_app(app, port=cfg.getint('Webserver', 'port'), ssl_context=ctx)
    else:
        logger.warn(" RUNNING IN NON SSL CONTEXT ")
        web.run_app(app, port=cfg.getint('Webserver', 'port'))
