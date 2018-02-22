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
async def join_room(sid, room):
    if room is None:
        room = ''
    if room not in PA.rooms:
        PA.add_room(room)
        with shelve.open("planar.save", "c") as shelf:
            if room in shelf:
                PA.rooms[room] = shelf[room]
    sio.enter_room(sid, room, namespace='/planarally')
    PA.clients[sid].room = room
    await sio.emit('token list', os.listdir(os.path.join("static", "img")), room=sid, namespace='/planarally')
    await sio.emit('board init', PA.get_client_room(sid).layer_manager.as_dict(), room=sid, namespace='/planarally')


@sio.on("client initialised", namespace='/planarally')
async def client_init(sid):
    PA.clients[sid].initialised = True


@sio.on('layer invalidate', namespace='/planarally')
async def layer_invalid(sid, message):
    if PA.clients[sid].initialised:
        PA.get_client_room(sid).layer_manager.layers[message['layer']].shapes = message['shapes']
        d = PA.get_client_room(sid).layer_manager.layers[message['layer']].as_dict()
        d['layer'] = message['layer']
        await sio.emit('layer set', d, room="skt", skip_sid=sid, namespace='/planarally')


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
