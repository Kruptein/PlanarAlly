import logging
from functools import wraps
from typing import Union

from aiohttp import web
from aiohttp_security import authorized_userid
from aiohttp_security.abc import AbstractAuthorizationPolicy
from typing_extensions import Literal

from ..db.models.constants import Constants
from ..db.models.user import User

logger = logging.getLogger("PlanarAllyServer")


async def get_authorized_user(request: web.Request):
    if username := await authorized_userid(request):
        if user := User.by_name(username):
            return user
    raise web.HTTPUnauthorized()


class AuthPolicy(AbstractAuthorizationPolicy):
    async def authorized_userid(self, identity):
        """Retrieve authorized user id.
        Return the user_id of the user identified by the identity
        or 'None' if no user exists related to the identity.
        """
        return identity

    async def permits(self, identity, permission, context=None):
        """Check user permissions.
        Return True if the identity is allowed the permission in the
        current context, else return False.
        """
        user: Union[User, None] = User.by_name(identity) if identity else None
        if user is None:
            return False

        if permission == "lobby.read":
            if user.role != Constants.role.DM:
                return user.can_play_game(context["room"])
            return True
        elif permission == "dm":
            return user.role == Constants.role.DM
        elif permission == "token.read":
            return user.role == Constants.role.DM
        return False


def login_required(app, sio, state: Union[Literal["game"], Literal["asset"], Literal["dashboard"]]):
    """
    Decorator that restrict access only for authorized users in a websocket context.
    """

    def real_decorator(fn):
        @wraps(fn)
        async def wrapped(*args, **kwargs):
            sid = args[0]
            if not app["state"]["asset"].has_sid(sid) and not app["state"][state].has_sid(sid):
                await sio.emit("redirect", "/")
                return
            return await fn(*args, **kwargs)

        return wrapped

    return real_decorator


def get_secret_token():
    return Constants.get().secret_token


def get_api_token():
    return Constants.get().api_token


@web.middleware
async def token_middleware(request: web.Request, handler):
    try:
        authorization = request.headers["Authorization"]
    except KeyError:
        raise web.HTTPUnauthorized(reason="Missing authorization header")

    if authorization != f"Bearer {get_api_token()}":
        raise web.HTTPForbidden(reason="Invalid authorization header.")

    return await handler(request)
