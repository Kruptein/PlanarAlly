"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import os
import shelve
import socketio

from aiohttp import web

from planarally import PlanarAlly

PA = PlanarAlly()

sio = socketio.AsyncServer(async_mode='aiohttp')
app = web.Application()
sio.attach(app)


async def index(request):
    with open('planarally.html') as f:
        return web.Response(text=f.read(), content_type='text/html')


@sio.on("join room", namespace='/planarally')
async def join_room(sid, room, dm):
    if room is None:
        room = ''
    if dm is None:
        dm = False
    else:
        dm = True
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


@sio.on('layer invalidate', namespace='/planarally')
async def layer_invalid(sid, message):
    if PA.clients[sid].initialised:
        room = PA.get_client_room(sid)
        layer = room.layer_manager.get_layer(message['layer'])
        if room.dm != sid and not layer.player_editable:
            print(f"{sid} attempted to invalidate a dm layer")
            return
        layer.shapes = message['shapes']
        d = layer.as_dict()
        if layer.player_visible:
            await sio.emit('layer set', d, room=room.name, skip_sid=sid, namespace='/planarally')


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
    print(f"Client {sid} connected")
    PA.add_client(sid)


@sio.on('disconnect', namespace='/planarally')
async def test_disconnect(sid):
    print(f'Client {sid} disconnected')
    room = PA.get_client_room(sid)
    with shelve.open("planar.save", "c") as shelf:
        shelf[room.name] = room


app.router.add_static('/static', 'static')
app.router.add_get('/', index)


if __name__ == '__main__':
    if os.path.isdir("cert"):
        import ssl

        ctx = ssl.SSLContext()
        ctx.load_cert_chain("cert/fullchain.pem", "cert/privkey.pem")
        web.run_app(app, port=8000, ssl_context=ctx)
    else:
        print(" RUNNING IN NON SSL CONTEXT ")
        web.run_app(app, port=8000)
