import bcrypt
import shelve

from aiohttp_security.abc import AbstractAuthorizationPolicy


class User:
    def __init__(self, username):
        self.username = username
        self.password_hash = None

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

        self.load_save()

    def load_save(self):
        with shelve.open(self.save_file, 'c') as shelf:
            self.user_map = shelf.get('user_map', {})

    def save(self):
        with shelve.open(self.save_file, 'c') as shelf:
            shelf['user_map'] = self.user_map

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


async def check_credentials(user_map, username, password):
    user = user_map.get(username)
    if not user:
        return False

    return user.password == password
