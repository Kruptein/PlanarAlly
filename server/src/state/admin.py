from ..api.socket.constants import ADMIN_NS
from ..app import app
from ..db.models.user import User
from . import State


class AdminState(State[User]):
    def __init__(self) -> None:
        super().__init__(ADMIN_NS)

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


admin_state = AdminState()
app["state"]["admin"] = admin_state
