import asyncio
import os
import socketio

from aiohttp import web

from planarally import PlanarAlly

PA = PlanarAlly()

sio = socketio.AsyncServer(async_mode='aiohttp')
app = web.Application()
sio.attach(app)

print(PA.layer_manager.as_dict())


async def index(request):
    with open('planarally.html') as f:
        return web.Response(text=f.read(), content_type='text/html')


@sio.on("client initialised", namespace='/planarally')
async def client_init(sid):
    PA.clients[sid].initialised = True


@sio.on('layer invalidate', namespace='/planarally')
async def layer_invalid(sid, message):
    if PA.clients[sid].initialised:
        PA.layer_manager.layers[message['layer']].shapes = message['shapes']
        print(message['shapes'])
        print(PA.layer_manager.as_dict())
        d = PA.layer_manager.layers[message['layer']].as_dict()
        d['layer'] = message['layer']
        await sio.emit('layer set', d, room="skt", skip_sid=sid, namespace='/planarally')


@sio.on('disconnect request', namespace='/planarally')
async def disconnect_request(sid):
    sio.leave_room(sid, "skt", namespace='/planarally')
    await sio.disconnect(sid, namespace='/planarally')


@sio.on('connect', namespace='/planarally')
async def test_connect(sid, environ):
    PA.add_client(sid)
    sio.enter_room(sid, "skt", namespace='/planarally')
    await sio.emit('board init', PA.layer_manager.as_dict(), room=sid, namespace='/planarally')


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
