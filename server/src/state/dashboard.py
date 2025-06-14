from ..api.socket.constants import DASHBOARD_NS
from ..app import app
from ..db.models.user import User
from . import State


class DashboardState(State[User]):
    def __init__(self) -> None:
        super().__init__(DASHBOARD_NS)

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


dashboard_state = DashboardState()
app["state"]["dashboard"] = dashboard_state
