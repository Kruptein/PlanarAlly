import secrets

from aiohttp import web

from ....db.models.user import User


async def collect(_request: web.Request) -> web.Response:
    users = [{"name": u.name, "email": u.email} for u in User.select()]
    return web.json_response(users)


async def reset(request: web.Request) -> web.Response:
    data = await request.json()
    new_pw = secrets.token_urlsafe(20)
    if user := User.by_name(data["name"]):
        user.set_password(new_pw)
        user.save()
        return web.json_response(new_pw)
    return web.HTTPNotFound()


async def remove(request: web.Request) -> web.Response:
    data = await request.json()
    if user := User.by_name(data["name"]):
        try:
            user.delete_instance(recursive=True)
        except:
            return web.HTTPBadRequest(reason="User removal did not succeed.")
        return web.HTTPOk()
    return web.HTTPNotFound()
