from typing import Dict

from . import State
from app import app
from models import User


class AssetState(State[User]):
    def get_user(self, sid: int) -> User:
        return self._sid_map[sid]


asset_state = AssetState()
app["state"]["asset"] = asset_state

