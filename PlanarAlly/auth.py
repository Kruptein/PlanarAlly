import logging
import sys
from aiohttp_security.abc import AbstractAuthorizationPolicy
from distutils.version import StrictVersion
from functools import wraps

from models import Constants, User

logger = logging.getLogger('PlanarAllyServer')


class PA_AuthPolicy(AbstractAuthorizationPolicy):
    def __init__(self):
        super().__init__()
        self.sid_map = {}

    def get_sid(self, user, room):
        for sid in self.sid_map:
            if 'room' not in self.sid_map[sid]:
                logger.error("ROOM NOT IN SID_MAP")
                logger.error(sid)
                logger.error(self.sid_map[sid])
                continue
            if self.sid_map[sid]['user'] == user and self.sid_map[sid]['room'] == room:
                return sid

    async def authorized_userid(self, identity):
        """Retrieve authorized user id.
        Return the user_id of the user identified by the identity
        or 'None' if no user exists related to the identity.
        """
        user = User.get_or_none(User.username == identity)
        if user:
            return user

    async def permits(self, identity, permission, context=None):
        """Check user permissions.
        Return True if the identity is allowed the permission in the
        current context, else return False.
        """
        # pylint: disable=unused-argument
        user = self.user_map.get(identity)
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
            policy = app['AuthzPolicy']
            if sid not in policy.sio_map:
                await sio.emit("redirect", "/")
                return
            return await fn(*args, **kwargs)
        return wrapped
    return real_decorator


def get_secret_token():
    return Constants.get().secret_token
