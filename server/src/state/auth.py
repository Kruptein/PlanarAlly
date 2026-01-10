import secrets
from datetime import datetime, timedelta

from ..app import app
from ..db.models.user import User
from . import State


class AuthState(State[User]):
    def __init__(self) -> None:
        super().__init__(None)
        # reset_tokens[token] = (user_id, expiration)
        self.reset_tokens: dict[str, tuple[int, datetime]] = {}

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]

    def add_reset_token(self, user_id: int) -> str:
        token = secrets.token_hex(16)
        expiration = datetime.now() + timedelta(hours=1)
        self.reset_tokens[token] = (user_id, expiration)
        return token

    def get_uid_from_token(self, token: str) -> int | None:
        if token not in self.reset_tokens:
            return None
        user_id, expiration = self.reset_tokens[token]
        del self.reset_tokens[token]
        if expiration < datetime.now():
            return None
        return user_id


auth_state = AuthState()
app["state"]["auth"] = auth_state
