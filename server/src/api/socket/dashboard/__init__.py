from ....api.socket.constants import DASHBOARD_NS
from ....app import sio
from ....auth import get_authorized_user
from ....config import cfg
from ....state.dashboard import dashboard_state
from . import campaign  # noqa: F401


@sio.on("connect", namespace=DASHBOARD_NS)
async def dashboard_connect(sid: str, environ):
    user = await get_authorized_user(environ["aiohttp.request"])
    if user is not None:
        await dashboard_state.add_sid(sid, user)
        if cfg().general.enable_export:
            await sio.emit("Export.Enabled", True, to=sid, namespace=DASHBOARD_NS)


@sio.on("disconnect", namespace=DASHBOARD_NS)
async def disconnect(sid):
    if not dashboard_state.has_sid(sid):
        return

    await dashboard_state.remove_sid(sid)
