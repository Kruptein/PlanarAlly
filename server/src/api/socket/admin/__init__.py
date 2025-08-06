import secrets
from uuid import uuid4

from ....api.models.notification import NotificationShow
from ....api.socket.constants import ADMIN_NS
from ....app import sio
from ....auth import get_authorized_user
from ....config import cfg
from ....db.models.notification import Notification
from ....db.models.room import Room
from ....db.models.user import User
from ....state.admin import admin_state


def is_admin(user: User) -> bool:
    return user.name == cfg().general.admin_user


@sio.on("connect", namespace=ADMIN_NS)
async def admin_connect(sid: str, environ):
    user = await get_authorized_user(environ["aiohttp.request"])
    if user is None:
        await sio.disconnect(sid, ADMIN_NS)
        return
    elif not is_admin(user):
        await sio.disconnect(sid, ADMIN_NS)
        return

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
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    Notification.create(uuid=uuid4(), message=message)

    await send_notifications(sid)


@sio.on("Users.List", namespace=ADMIN_NS)
async def list_users(sid: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    users = [{"name": u.name, "email": u.email} for u in User.select()]

    return users


@sio.on("Users.Reset", namespace=ADMIN_NS)
async def reset_user(sid: str, name: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    target_user = User.by_name(name)
    if target_user is None:
        return False
    new_pw = secrets.token_urlsafe(20)
    target_user.set_password(new_pw)
    target_user.save()
    return new_pw


@sio.on("Users.Remove", namespace=ADMIN_NS)
async def remove_user(sid: str, name: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    target_user = User.by_name(name)
    if target_user is None:
        return False
    try:
        target_user.delete_instance(recursive=True)
    except:
        return False
    return True


@sio.on("Campaigns.List", namespace=ADMIN_NS)
async def list_campaigns(sid: str):
    user = admin_state.get_user(sid)
    if not is_admin(user):
        return

    rooms = Room.select()
    return [{"name": r.name, "creator": r.creator.name} for r in rooms]
