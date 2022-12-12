from typing import Any, Dict

from ..app import app
from ..models import User
from . import State


class AssetState(State[User]):
    def __init__(self) -> None:
        super().__init__()
        self.pending_file_upload_cache: Dict[str, Any] = {}

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


asset_state = AssetState()
app["state"]["asset"] = asset_state
