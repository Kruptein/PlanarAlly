from typing import Any, Dict

from . import State
from app import app
from models import User


class AssetState(State[User]):
    def __init__(self) -> None:
        super().__init__()
        self.pending_file_upload_cache: Dict[str, Any] = {}

    def get_user(self, sid: int) -> User:
        return self._sid_map[sid]


asset_state = AssetState()
app["state"]["asset"] = asset_state
