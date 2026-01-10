from ..api.models.asset import ApiAssetUpload
from ..api.socket.constants import ASSET_NS
from ..app import app
from ..db.models.user import User
from . import State


class AssetState(State[User]):
    def __init__(self) -> None:
        super().__init__(ASSET_NS)
        self.pending_file_upload_cache: dict[str, dict[int, ApiAssetUpload]] = {}

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid]


asset_state = AssetState()
app["state"]["asset"] = asset_state
