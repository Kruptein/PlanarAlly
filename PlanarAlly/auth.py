import bcrypt
import dbm
import logging
import secrets
import shelve
import sys
from distutils.version import StrictVersion
from functools import wraps

from aiohttp_security.abc import AbstractAuthorizationPolicy

logger = logging.getLogger('PlanarAllyServer')


class User:
    def __init__(self, username):
        self.username = username
        self.password_hash = None
        self.asset_info = {'__files': []}
        self.options = {}

    def set_password(self, pw):
        pwhash = bcrypt.hashpw(pw.encode('utf8'), bcrypt.gensalt())
        self.password_hash = pwhash.decode('utf8')

    def check_password(self, pw):
        if self.password_hash is None:
            return False
        expected_hash = self.password_hash.encode('utf8')
        return bcrypt.checkpw(pw.encode('utf8'), expected_hash)


class ShelveDictAuthorizationPolicy(AbstractAuthorizationPolicy):
    def __init__(self, save):
        super().__init__()
        self.save_file = save
        self.user_map = {}
        self.sio_map = {}
        self.secret_token = None

        self.load_save()

    def get_sid(self, user, room):
        for sid in self.sio_map:
            if 'room' not in self.sio_map[sid]:
                logger.error("ROOM NOT IN SIO_MAP")
                logger.error(sid)
                logger.error(self.sio_map[sid])
                continue
            if self.sio_map[sid]['user'] == user and self.sio_map[sid]['room'] == room:
                return sid

    def load_save(self):
        with shelve.open(self.save_file, 'c') as shelf:
            self.user_map = shelf.get('user_map', {})
            self.secret_token = shelf.get(
                'secret_token', secrets.token_bytes(32))

    def save(self):
        with shelve.open(self.save_file, 'c') as shelf:
            shelf['user_map'] = self.user_map
            shelf['secret_token'] = self.secret_token

    async def authorized_userid(self, identity):
        """Retrieve authorized user id.
        Return the user_id of the user identified by the identity
        or 'None' if no user exists related to the identity.
        """
        if identity in self.user_map:
            return identity

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
