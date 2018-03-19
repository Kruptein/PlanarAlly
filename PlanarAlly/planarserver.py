"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import atexit
import os
import socketio

import aiohttp_jinja2
import aiohttp_security
import aiohttp_session
import jinja2
from aiohttp import web
from aiohttp_security import remember, forget, authorized_userid, login_required, SessionIdentityPolicy
from aiohttp_session.cookie_storage import EncryptedCookieStorage

import auth
from planarally import PlanarAlly

PA = PlanarAlly("planar.save")

sio = socketio.AsyncServer(async_mode='aiohttp', engineio_logger=False)
app = web.Application()
app["AuthzPolicy"] = auth.ShelveDictAuthorizationPolicy("planar.save")
aiohttp_security.setup(app, SessionIdentityPolicy(), app['AuthzPolicy'])
aiohttp_session.setup(app, EncryptedCookieStorage(app['AuthzPolicy'].secret_token))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
sio.attach(app)


@atexit.register
def save_all():
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
            return {'dm': True, 'invitation_code': room.invitation_code}
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


# SOCKETS
@sio.on("add shape", namespace="/planarally")
@auth.login_required(app, sio)
async def add_shape(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])

    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to add a shape to a dm layer")
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
                await sio.emit("add shape", shape_wrap(player, data['shape']), room=psid, namespace='/planarally')

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("add shape", data['shape'], room=croom, namespace='/planarally')


@sio.on("remove shape", namespace="/planarally")
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
            print(f"{username} attempted to remove a shape from a dm layer")
            return
        if username not in orig_shape['owners']:
            print(f"{username} attempted to remove a shape it does not own")
            return

    if data['temporary']:
        location.client_temporaries[sid].remove(data['shape']['uuid'])
    else:
        del layer.shapes[data['shape']['uuid']]
    if layer.player_visible:
        await sio.emit("remove shape", data['shape'], room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("moveShapeOrder", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape_order(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to move a shape order on a dm layer")
        return
    layer.shapes.move_to_end(data['shape']['uuid'], data['index'] != 0)
    if layer.player_visible:
        await sio.emit("moveShapeOrder", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("shapeMove", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape(sid, data):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']
    location = room.get_active_location(username)

    layer = location.layer_manager.get_layer(data['shape']['layer'])

    if data['temporary']:
        orig_shape = data['shape']  # This stuff is not stored so we cannot do any server side validation /shrug
    else:
        orig_shape = layer.shapes[data['shape']['uuid']]

    if room.creator != username:
        if not layer.player_editable:
            print(f"{username} attempted to move a shape on a dm layer")
            return
        if username not in orig_shape['owners']:
            print(f"{username} attempted to move asset it does not own")
            return
    if not data['temporary']:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        for player in room.players:
            if player == username:
                continue
            psid = policy.get_sid(policy.user_map[player], room)
            if psid is not None:
                await sio.emit("shapeMove", shape_wrap(player, data['shape']), room=psid, namespace='/planarally')
    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("shapeMove", data['shape'], room=croom, namespace='/planarally')


def shape_wrap(player, shape):
    """
    Helper function to make sure only data that the given player is allowed to see is sent.
    """
    pl_shape = dict(shape)
    pl_shape['trackers'] = [t for t in shape['trackers'] if player in pl_shape['owners'] or t['visible']]
    pl_shape['auras'] = [a for a in shape['auras'] if player in pl_shape['owners'] or a['visible']]
    return pl_shape


@sio.on("updateShape", namespace='/planarally')
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
            print(f"{username} attempted to change asset it does not own")
            return

    layer.shapes[data['shape']['uuid']] = data['shape']

    for player in room.players:
        if player == username:
            continue
        pl_data = dict(data)
        pl_data['shape'] = shape_wrap(player, data['shape'])
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            await sio.emit("updateShape", pl_data, room=psid, namespace='/planarally')

    if room.creator != username:
        croom = policy.get_sid(policy.user_map[room.creator], room)
        if croom is not None:
            await sio.emit("updateShape", data, room=croom, namespace='/planarally')


@sio.on("client set", namespace='/planarally')
@auth.login_required(app, sio)
async def set_client(sid, data):
    user = app['AuthzPolicy'].sio_map[sid]['user']
    user.options.update(**data)
    app['AuthzPolicy'].save()


@sio.on("set locationOptions", namespace='/planarally')
@auth.login_required(app, sio)
async def set_room(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        print(f"{username} attempted to set a room option")
        return

    location.options.update(**data)
    await sio.emit("set locationOptions", data, room=location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("set gridsize", namespace="/planarally")
@auth.login_required(app, sio)
async def set_gridsize(sid, grid_size):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    if room.creator != username:
        print(f"{username} attempted to set gridsize without DM rights")
        return
    location.layer_manager.get_grid_layer().size = grid_size
    await sio.emit("set gridsize", grid_size, room=location.sioroom, skip_sid=sid, namespace="/planarally")


@sio.on("new location", namespace='/planarally')
async def add_new_location(sid, location):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if room.creator != username:
        print(f"{username} attempted to add a new location")
        return

    room.add_new_location(location)
    sio.leave_room(sid, room.get_active_location(username).sioroom, namespace='/planarally')
    room.dm_location = location
    sio.enter_room(sid, room.get_active_location(username).sioroom, namespace='/planarally')
    PA.save_room(room)
    await sio.emit('board init', room.get_board(username), room=sid, namespace='/planarally')


@sio.on("change location", namespace='/planarally')
async def change_location(sid, location):
    policy = app['AuthzPolicy']
    username = policy.sio_map[sid]['user'].username
    room = policy.sio_map[sid]['room']

    if room.creator != username:
        print(f"{username} attempted to change location")
        return

    old_location = room.get_active_location(username)
    sio.leave_room(sid, old_location.sioroom, namespace='/planarally')
    room.dm_location = location
    new_location = room.get_active_location(username)
    sio.enter_room(sid, new_location.sioroom, namespace='/planarally')
    await sio.emit('board init', room.get_board(username), room=sid, namespace='/planarally')

    room.player_location = location
    PA.save_room(room)
    for player in room.players:
        psid = policy.get_sid(policy.user_map[player], room)
        if psid is not None:
            sio.leave_room(psid, old_location.sioroom, namespace='/planarally')
            sio.enter_room(psid, new_location.sioroom, namespace='/planarally')
    await sio.emit('board init', room.get_board(''), room=new_location.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace='/planarally')
    else:
        ref = environ['HTTP_REFERER'].strip("/").split("/")
        room = PA.rooms[(ref[-1], ref[-2])]
        location = room.get_active_location(username)

        app['AuthzPolicy'].sio_map[sid] = {
            'user': app['AuthzPolicy'].user_map[username],
            'room': room
        }
        print(f"User {username} connected with identifier {sid}")

        sio.enter_room(sid, location.sioroom, namespace='/planarally')
        await sio.emit("set username", username, room=sid, namespace='/planarally')
        await sio.emit("set clientOptions", app['AuthzPolicy'].user_map[username].options, room=sid,
                       namespace='/planarally')
        await sio.emit('board init', room.get_board(username), room=sid, namespace='/planarally')
        await sio.emit("set locationOptions", location.options, room=sid, namespace='/planarally')
        await sio.emit('asset list', PA.get_asset_list(), room=sid, namespace='/planarally')


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    if sid not in app['AuthzPolicy'].sio_map:
        return
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']
    location = room.get_active_location(username)

    print(f'User {username} disconnected with identifier {sid}')
    del app['AuthzPolicy'].sio_map[sid]

    if sid in location.client_temporaries:
        await sio.emit("clear temporaries", location.client_temporaries[sid])
        del location.client_temporaries[sid]

    # for value in app['AuthzPolicy'].sio_map.values():
    #     if value['room'] == room:
    #         break
    # else:
    #     PA.save_room(room)
    PA.save_room(room)


app.router.add_static('/static', 'static')
app.router.add_route('*', '/', login)
app.router.add_get('/rooms', show_rooms)
app.router.add_get('/rooms/{username}/{roomname}', show_room)
app.router.add_get('/invite/{code}', claim_invite)
app.router.add_post('/create_room', create_room)
app.router.add_get('/logout', logout)

if __name__ == '__main__':
    if os.path.isdir("cert"):
        import ssl

        ctx = ssl.SSLContext()
        ctx.load_cert_chain("cert/fullchain.pem", "cert/privkey.pem")
        web.run_app(app, port=8000, ssl_context=ctx)
    else:
        print(" RUNNING IN NON SSL CONTEXT ")
        web.run_app(app, port=8000)
