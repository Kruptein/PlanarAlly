import asyncio
import random

from aiohttp import web
from aiohttp_security import authorized_userid, forget, remember

from ...auth import get_authorized_user
from ...config import config
from ...db.db import db
from ...db.models.user import User
from ...mail import send_mail
from ...state.auth import auth_state


async def is_authed(request):
    user = await get_authorized_user(request)

    if user is None:
        data = {"auth": False, "username": ""}
    else:
        data = {"auth": True, "username": user.name, "email": user.email}
    return web.json_response(data)


async def login(request):
    try:
        user = await get_authorized_user(request)
    except web.HTTPUnauthorized:
        pass
    else:
        return web.json_response({"email": user.email})

    data = await request.json()
    username = data["username"]
    password = data["password"]
    u = User.by_name(username)
    if u is None or not u.check_password(password):
        return web.HTTPUnauthorized(reason="Username and/or Password do not match")
    response = web.json_response({"email": u.email})
    await remember(request, response, username)
    return response


async def register(request):
    if not config.getboolean("General", "allow_signups"):
        return web.HTTPForbidden()

    if await authorized_userid(request) is not None:
        return web.HTTPOk()

    data = await request.json()
    username = data["username"]
    password = data["password"]
    email = data.get("email", None)
    if User.by_name(username):
        return web.HTTPConflict(reason="Username already taken")
    elif not username:
        return web.HTTPBadRequest(reason="Please provide a username")
    elif not password:
        return web.HTTPBadRequest(reason="Please provide a password")
    else:
        try:
            with db.atomic():
                User.create_new(username, password, email)
        except:
            return web.HTTPServerError(
                reason="An unexpected error occured on the server during account creation.  Operation reverted."
            )
        response = web.HTTPOk()
        await remember(request, response, username)
        return response


async def logout(request):
    response = web.HTTPOk()
    await forget(request, response)
    return response


async def forgot_password(request):
    data = await request.json()
    email = data["email"]
    user = User.by_email(email)

    # If the email is not found,
    # we just return a 200 to avoid leaking information
    if user is None:
        await asyncio.sleep(random.randint(1, 5))
        return web.HTTPOk()

    reset_token = auth_state.add_reset_token(user.id)

    reset_url = f"{config.get('General', 'client_url', fallback='')}/auth/login?resetToken={reset_token}"

    print(reset_url)

    # Send the email
    send_mail(
        "Password reset request",
        f"A password reset for the PlanarAlly account associated with this email address was requested. Visit {reset_url} to reset your password. If you did not do this, please ignore this email.",
        f"A password reset for the PlanarAlly account associated with this email address was requested. Visit <a href='{reset_url}'>{reset_url}</a> to reset your password.<br><br>If you did not do this, please ignore this email.",
        [email],
    )

    return web.HTTPOk()


async def reset_password(request):
    data = await request.json()
    token = data["token"]
    password = data["password"]

    uid = auth_state.get_uid_from_token(token)
    if uid is None:
        return web.HTTPNotFound()

    user = User.get_by_id(uid)
    user.set_password(password)
    user.save()

    return web.HTTPOk()
