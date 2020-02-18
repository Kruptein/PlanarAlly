from aiohttp import web
from aiohttp_security import check_authorized, forget

from models import User


async def set_email(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()
    user.email = data["email"]
    user.save()
    return web.HTTPOk()


async def set_password(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()
    user.set_password(data["password"])
    user.save()
    return web.HTTPOk()


async def delete_account(request: web.Request):
    user: User = await check_authorized(request)
    user.delete_instance(recursive=True)
    response = web.HTTPOk()
    await forget(request, response)
    return response
