from pydantic import BaseModel

from .player import *


class RoomInfoSet(BaseModel):
    name: str
    creator: str
    invitationCode: str
    isLocked: bool
    publicName: str
