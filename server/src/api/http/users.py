from aiohttp import web
from aiohttp_security import forget

from ...auth import get_authorized_user


async def set_email(request: web.Request):
    user = await get_authorized_user(request)
    data = await request.json()
    user.email = data["email"]
    user.save()
    return web.HTTPOk()


async def set_password(request: web.Request):
    user = await get_authorized_user(request)
    data = await request.json()
    user.set_password(data["password"])
    user.save()
    return web.HTTPOk()


async def delete_account(request: web.Request):
    user = await get_authorized_user(request)
    user.delete_instance(recursive=True)
    response = web.HTTPOk()
    await forget(request, response)
    return response
