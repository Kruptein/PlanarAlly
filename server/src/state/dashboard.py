from . import State
from app import app
from models import User


class DashboardState(State[User]):
    def __init__(self) -> None:
        super().__init__()

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


dashboard_state = DashboardState()
app["state"]["dashboard"] = dashboard_state
