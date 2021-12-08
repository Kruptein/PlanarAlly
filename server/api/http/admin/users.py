import secrets
from aiohttp import web

from models import User


async def collect(request: web.Request) -> web.Response:
    users = [{"name": u.name, "email": u.email} for u in User.select()]
    return web.json_response(users)


async def reset(request: web.Request) -> web.Response:
    data = await request.json()
    new_pw = secrets.token_urlsafe(20)
    user = User.by_name(data["name"])
    user.set_password(new_pw)
    user.save()
    return web.json_response(new_pw)
