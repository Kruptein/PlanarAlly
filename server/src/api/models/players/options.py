from pydantic import BaseModel

from ..helpers import Nullable
from ..user import ApiOptionalUserOptions, ApiUserOptions


class PlayerOptionsSet(BaseModel):
    colour_history: str | Nullable
    default_user_options: ApiUserOptions
    room_user_options: ApiOptionalUserOptions | None = None
