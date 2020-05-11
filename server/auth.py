import logging
from aiohttp_security.abc import AbstractAuthorizationPolicy
from functools import wraps

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

    async def permits(self, identity, permission, context=None):
        """Check user permissions.
        Return True if the identity is allowed the permission in the
        current context, else return False.
        """
        # pylint: disable=unused-argument
        user = User.by_name(identity)
        if not user:
            return False
        return permission in user.permissions


def login_required(app, sio):
    """
    Decorator that restrict access only for authorized users in a websocket context.
    """

    def real_decorator(fn):
        @wraps(fn)
        async def wrapped(*args, **kwargs):
            sid = args[0]
            if not app["state"]["asset"].has_sid(sid) and not app["state"][
                "game"
            ].has_sid(sid):
                await sio.emit("redirect", "/")
                return
            return await fn(*args, **kwargs)

        return wrapped

    return real_decorator


def get_secret_token():
    return Constants.get().secret_token
