import logging
from functools import wraps
from typing import Union
from typing_extensions import Literal

from aiohttp import web
from aiohttp_security.abc import AbstractAuthorizationPolicy

from models import Constants, User

logger = logging.getLogger("PlanarAllyServer")


class AuthPolicy(AbstractAuthorizationPolicy):
    async def authorized_userid(self, identity):
        """Retrieve authorized user id.
        Return the user_id of the user identified by the identity
        or 'None' if no user exists related to the identity.
        """
        user = User.by_name(identity)
        if user:
            return user

    async def permits(self, _identity, _permission, _context=None):
        """Check user permissions.
        Return True if the identity is allowed the permission in the
        current context, else return False.
        """
        return False


def login_required(
    app, sio, state: Union[Literal["game"], Literal["asset"], Literal["dashboard"]]
):
    """
    Decorator that restrict access only for authorized users in a websocket context.
    """

    def real_decorator(fn):
        @wraps(fn)
        async def wrapped(*args, **kwargs):
            sid = args[0]
            if not app["state"]["asset"].has_sid(sid) and not app["state"][
                state
            ].has_sid(sid):
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
