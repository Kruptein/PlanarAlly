from pydantic import Field

from ..helpers import TypeIdModel
from ..user import ApiOptionalUserOptions, ApiUserOptions


class PlayerOptionsSet(TypeIdModel):
    colour_history: str | None = Field(..., noneAsNull=True)
    default_user_options: ApiUserOptions
    room_user_options: ApiOptionalUserOptions | None = None
