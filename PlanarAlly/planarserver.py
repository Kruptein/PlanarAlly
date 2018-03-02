"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import atexit
import os
import secrets
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
aiohttp_session.setup(app, EncryptedCookieStorage(secrets.token_bytes(32)))
aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
sio.attach(app)


@atexit.register
def save_all():
    for room in PA.rooms.values():
        with shelve.open("planar.save", "c") as shelf:
            if 'rooms' not in shelf:
                shelf['rooms'] = {}
            shelf['rooms'][room.name] = room


@aiohttp_jinja2.template("login.jinja2")
async def login(request):
    username = await authorized_userid(request)
    if username:
        return web.HTTPFound("/pa")
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
                response = web.HTTPFound("/pa")
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
@aiohttp_jinja2.template('planarally.html')
async def pa(request):
    return {}


@sio.on("join room", namespace='/planarally')
async def join_room(sid, room, dm):
    if room is None:
        room = ''
    if room not in PA.rooms:
        with shelve.open("planar.save", "c") as shelf:
            if room in shelf:
                PA.rooms[room] = shelf[room]
            else:
                PA.add_room(room)
    if dm:
        PA.rooms[room].dm = sid
    sio.enter_room(sid, room, namespace='/planarally')
    PA.clients[sid].room = room
    await sio.emit('board init', PA.rooms[room].get_board(dm), room=sid, namespace='/planarally')
    await sio.emit('token list', PA.get_token_list(), room=sid, namespace='/planarally')


@sio.on("client initialised", namespace='/planarally')
async def client_init(sid):
    PA.clients[sid].initialised = True


@sio.on("add shape", namespace="/planarally")
async def add_shape(sid, data):
    if not PA.clients[sid].initialised:
        return
    room = PA.get_client_room(sid)
    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.dm != sid and not layer.player_editable:
        print(f"{sid} attempted to add a shape to a dm layer")
        return
    if data['temporary']:
        room.add_temp(sid, data['shape']['uuid'])
    else:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        await sio.emit("add shape", data['shape'], room=room.name, skip_sid=sid, namespace='/planarally')


@sio.on("remove shape", namespace="/planarally")
async def remove_shape(sid, data):
    if not PA.clients[sid].initialised:
        return
    room = PA.get_client_room(sid)
    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.dm != sid and not layer.player_editable:
        print(f"{sid} attempted to remove a shape from a dm layer")
        return
    if data['temporary']:
        room.client_temporaries[sid].remove(data['shape']['uuid'])
    else:
        del layer.shapes[data['shape']['uuid']]
    if layer.player_visible:
        await sio.emit("remove shape", data['shape'], room=room.name, skip_sid=sid, namespace='/planarally')


@sio.on("moveShapeOrder", namespace="/planarally")
async def move_shape_order(sid, data):
    if not PA.clients[sid].initialised:
        return
    room = PA.get_client_room(sid)
    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.dm != sid and not layer.player_editable:
        print(f"{sid} attempted to move a shape order on a dm layer")
        return
    layer.shapes.move_to_end(data['shape']['uuid'], data['index'] != 0)
    if layer.player_visible:
        await sio.emit("moveShapeOrder", data, room=room.name, skip_sid=sid, namespace='/planarally')


@sio.on("shapeMove", namespace="/planarally")
async def move_shape(sid, data):
    if not PA.clients[sid].initialised:
        return
    room = PA.get_client_room(sid)
    layer = room.layer_manager.get_layer(data['shape']['layer'])
    if room.dm != sid and not layer.player_editable:
        print(f"{sid} attempted to move a shape on a dm layer")
        return
    if not data['temporary']:
        layer.shapes[data['shape']['uuid']] = data['shape']
    if layer.player_visible:
        await sio.emit("shapeMove", data['shape'], room=room.name, skip_sid=sid, namespace='/planarally')


@sio.on("set gridsize", namespace="/planarally")
async def set_gridsize(sid, grid_size):
    if PA.clients[sid].initialised:
        room = PA.get_client_room(sid)
        if room.dm != sid:
            print(f"{sid} attempted to set gridsize without DM rights")
            return
        room.layer_manager.get_grid_layer().size = grid_size
        await sio.emit("set gridsize", grid_size, room=room.name, skip_sid=sid, namespace="/planarally")


@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    username = await authorized_userid(environ['aiohttp.request'])
    if username is None:
        print("Unauthed user")  # todo LEL
    else:
        app['AuthzPolicy'].sio_map[sid] = app['AuthzPolicy'].user_map[username]
    print(f"Client {sid} connected")
    PA.add_client(sid)


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    print(f'Client {sid} disconnected')
    del app['AuthzPolicy'].sio_map[sid]
    room = PA.get_client_room(sid)
    if sid in room.client_temporaries:
        sio.emit("clear temporaries", room.client_temporaries[sid])
        del room.client_temporaries[sid]
    if len(PA.clients) == 1:
        with shelve.open("planar.save", "c") as shelf:
            if 'rooms' not in shelf:
                shelf['rooms'] = {}
            shelf['rooms'][room.name] = room
    del PA.clients[sid]


app.router.add_static('/static', 'static')
app.router.add_route('*', '/', login)
app.router.add_get('/pa', pa)
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
