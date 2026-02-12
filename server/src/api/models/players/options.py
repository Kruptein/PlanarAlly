from ..helpers import TypeIdModel
from ..user import ApiOptionalUserOptions, ApiUserOptions


class PlayerOptionsSet(TypeIdModel):
    colour_history: str | None
    default_user_options: ApiUserOptions
    room_user_options: ApiOptionalUserOptions | None
