from uuid import uuid4

from ....api.models.notification import NotificationShow
from ....api.socket.constants import ADMIN_NS
from ....app import sio
from ....auth import get_authorized_user
from ....db.models.notification import Notification
from ....db.models.user import User

# from ....config import cfg
from ....state.admin import admin_state


@sio.on("connect", namespace=ADMIN_NS)
async def admin_connect(sid: str, environ):
    user = await get_authorized_user(environ["aiohttp.request"])
    if user is None:
        await sio.disconnect(sid, ADMIN_NS)
        return
    # elif user.name != cfg().general.admin_user:
    #     await sio.disconnect(sid, ADMIN_NS)
    #     return

    await admin_state.add_sid(sid, user)

    await send_notifications(sid)


@sio.on("disconnect", namespace=ADMIN_NS)
async def disconnect(sid):
    if not admin_state.has_sid(sid):
        return

    await admin_state.remove_sid(sid)


async def send_notifications(sid):
    notifications = Notification.select()

    data = [NotificationShow(uuid=str(n.uuid), message=n.message) for n in notifications]

    await sio.emit("Notifications.List", data, to=sid, namespace=ADMIN_NS)


@sio.on("Notifications.Add", namespace=ADMIN_NS)
async def add_notification(sid: str, message: str):
    # todo: add permission checks
    Notification.create(uuid=uuid4(), message=message)

    await send_notifications(sid)


@sio.on("Users.List", namespace=ADMIN_NS)
async def list_users(sid: str):
    users = [{"name": u.name, "email": u.email} for u in User.select()]

    return users
