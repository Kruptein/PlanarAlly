from aiohttp import web
from aiohttp_security import authorized_userid, forget, remember

from app import logger
from models import User
from models.db import db


async def is_authed(request):
    user = await authorized_userid(request)

    if user is None:
        data = {"auth": False, "username": ""}
    else:
        data = {"auth": True, "username": user.name, "email": user.email}
    return web.json_response(data)


async def login(request):
    user = await authorized_userid(request)
    if user:
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
    username = await authorized_userid(request)
    if username:
        return web.HTTPOk()

    data = await request.json()
    username = data["username"]
    password = data["password"]
    if User.by_name(username):
        return web.HTTPConflict(reason="Username already taken")
    elif not username:
        return web.HTTPBadRequest(reason="Please provide a username")
    elif not password:
        return web.HTTPBadRequest(reason="Please provide a password")
    else:
        with db.atomic():
            u = User(name=username)
            u.set_password(password)
            u.save()
        response = web.HTTPOk()
        await remember(request, response, username)
        return response


async def logout(request):
    response = web.HTTPOk()
    await forget(request, response)
    return response
