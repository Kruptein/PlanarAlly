from aiohttp import web
from aiohttp_security import check_authorized

from models import User


async def set_email(request: web.Request):
    user: User = await check_authorized(request)
    data = await request.json()
    try:
        user.email = data["email"]
        user.save()
    except:
        return web.json_response({"success": False})
    return web.json_response({"success": True})
