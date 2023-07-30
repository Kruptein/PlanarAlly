from typing import Dict

from ..api.models.asset import ApiAssetUpload
from ..app import app
from ..db.models.user import User
from . import State


class AssetState(State[User]):
    def __init__(self) -> None:
        super().__init__()
        self.pending_file_upload_cache: Dict[str, Dict[int, ApiAssetUpload]] = {}

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


asset_state = AssetState()
app["state"]["asset"] = asset_state
