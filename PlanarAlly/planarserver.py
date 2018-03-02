"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import atexit
import os
import shelve
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

PA = PlanarAlly()

sio = socketio.AsyncServer(async_mode='aiohttp')
app = web.Application()
app["AuthzPolicy"] = auth.ShelveDictAuthorizationPolicy("planar.save")
aiohttp_security.setup(app, SessionIdentityPolicy(), app['AuthzPolicy'])
aiohttp_session.setup(app, EncryptedCookieStorage(app['AuthzPolicy'].secret_token))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
sio.attach(app)


@atexit.register
def save_all():
    with shelve.open("planar.save", "c") as shelf:
        if 'rooms' not in shelf:
            rooms = {}
        else:
            rooms = shelf['rooms']
        for room in PA.rooms.values():
            rooms[room.sioroom] = room
            shelf['rooms'] = rooms


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
@aiohttp_jinja2.template('planarally.html')
async def show_room(request):
    username = await authorized_userid(request)
    try:
        room = PA.rooms[(request.match_info['roomname'], request.match_info['username'])]
    except KeyError:
        pass
    else:
        if username in room.players or room.creator == username:
            return {}
    return web.HTTPFound("/rooms")


# SOCKETS
@sio.on("add shape", namespace="/planarally")
@auth.login_required(app, sio)
async def add_shape(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to add a shape to a dm layer")
        return
    if data['temporary']:
        room.add_temp(sid, data['shape']['uuid'])
    else:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        await sio.emit("add shape", data['shape'], room=room.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("remove shape", namespace="/planarally")
@auth.login_required(app, sio)
async def remove_shape(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to remove a shape from a dm layer")
        return
    if data['temporary']:
        room.client_temporaries[sid].remove(data['shape']['uuid'])
    else:
        del layer.shapes[data['shape']['uuid']]
    if layer.player_visible:
        await sio.emit("remove shape", data['shape'], room=room.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("moveShapeOrder", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape_order(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to move a shape order on a dm layer")
        return
    layer.shapes.move_to_end(data['shape']['uuid'], data['index'] != 0)
    if layer.player_visible:
        await sio.emit("moveShapeOrder", data, room=room.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("shapeMove", namespace="/planarally")
@auth.login_required(app, sio)
async def move_shape(sid, data):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.creator != username and not layer.player_editable:
        print(f"{username} attempted to move a shape on a dm layer")
        return
    if not data['temporary']:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        await sio.emit("shapeMove", data['shape'], room=room.sioroom, skip_sid=sid, namespace='/planarally')


@sio.on("set gridsize", namespace="/planarally")
@auth.login_required(app, sio)
async def set_gridsize(sid, grid_size):
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    if room.creator != username:
        print(f"{username} attempted to set gridsize without DM rights")
        return
    room.layer_manager.get_grid_layer().size = grid_size
    await sio.emit("set gridsize", grid_size, room=room.sioroom, skip_sid=sid, namespace="/planarally")


@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace='/planarally')
    else:
        ref = environ['HTTP_REFERER'].strip("/").split("/")
        room = PA.rooms[(ref[-1], ref[-2])]

        app['AuthzPolicy'].sio_map[sid] = {
            'user': app['AuthzPolicy'].user_map[username],
            'room': room
        }
        print(f"User {username} connected with identifier {sid}")

        sio.enter_room(sid, f"{room.name}_{room.creator}", namespace='/planarally')
        await sio.emit('board init', room.get_board(username), room=sid, namespace='/planarally')
        await sio.emit('token list', PA.get_token_list(), room=sid, namespace='/planarally')


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    if sid not in app['AuthzPolicy'].sio_map:
        return
    username = app['AuthzPolicy'].sio_map[sid]['user'].username
    room = app['AuthzPolicy'].sio_map[sid]['room']

    print(f'User {username} disconnected with identifier {sid}')
    del app['AuthzPolicy'].sio_map[sid]

    if sid in room.client_temporaries:
        sio.emit("clear temporaries", room.client_temporaries[sid])
        del room.client_temporaries[sid]

    for value in app['AuthzPolicy'].sio_map.values():
        if value['room'] == room:
            break
    else:
        print(f"Saving {room.sioroom}")
        with shelve.open("planar.save", "c") as shelf:
            # DO NOT change this to shelf['rooms'][room.sioroom] = room
            # it will not write through to disk!
            if 'rooms' not in shelf:
                rooms = {}
            else:
                rooms = shelf['rooms']
            rooms[room.sioroom] = room
            shelf['rooms'] = rooms


app.router.add_static('/static', 'static')
app.router.add_route('*', '/', login)
app.router.add_get('/rooms', show_rooms)
app.router.add_get('/rooms/{username}/{roomname}', show_room)
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
