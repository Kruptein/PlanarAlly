import asyncio
import os
import socketio

from aiohttp import web


sio = socketio.AsyncServer(async_mode='aiohttp')
app = web.Application()
sio.attach(app)


async def index(request):
    with open('planarally.html') as f:
        return web.Response(text=f.read(), content_type='text/html')


@sio.on('my event', namespace='/planarally')
async def test_message(sid, message):
    await sio.emit('my response', {'data': message['data']}, room=sid,
                   namespace='/planarally')


@sio.on('my broadcast event', namespace='/planarally')
async def test_broadcast_message(sid, message):
    await sio.emit('my response', {'data': message['data']}, namespace='/planarally')


@sio.on('join', namespace='/planarally')
async def join(sid, message):
    sio.enter_room(sid, message['room'], namespace='/planarally')
    await sio.emit('my response', {'data': 'Entered room: ' + message['room']},
                   room=sid, namespace='/planarally')


@sio.on('leave', namespace='/planarally')
async def leave(sid, message):
    sio.leave_room(sid, message['room'], namespace='/planarally')
    await sio.emit('my response', {'data': 'Left room: ' + message['room']},
                   room=sid, namespace='/planarally')


@sio.on('close room', namespace='/planarally')
async def close(sid, message):
    await sio.emit('my response',
                   {'data': 'Room ' + message['room'] + ' is closing.'},
                   room=message['room'], namespace='/planarally')
    await sio.close_room(message['room'], namespace='/planarally')


@sio.on('my room event', namespace='/planarally')
async def send_room_message(sid, message):
    await sio.emit('my response', {'data': message['data']},
                   room=message['room'], namespace='/planarally')


@sio.on('disconnect request', namespace='/planarally')
async def disconnect_request(sid):
    await sio.disconnect(sid, namespace='/planarally')


@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    await sio.emit('my response', {'data': 'Connected', 'count': 0}, room=sid,
                   namespace='/planarally')


@sio.on('disconnect', namespace='/planarally')
def test_disconnect(sid):
    print('Client disconnected')


app.router.add_static('/static', 'static')
app.router.add_get('/', index)


if __name__ == '__main__':
    if os.path.isdir("cert"):
        import ssl
        ctx = ssl.SSLContext(protocol=ssl.PROTOCOL_TLS)
        ctx.load_cert_chain("cert/fullchain.pem", "cert/privkey.pem")
        web.run_app(app, port=8000, ssl_context=ctx)
    else:
        print(" RUNNING IN NON SSL CONTEXT ")
        web.run_app(app, port=8000)
