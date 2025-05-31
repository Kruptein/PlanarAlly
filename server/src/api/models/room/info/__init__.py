from pydantic import BaseModel

from ...mods import ApiModMeta
from .player import *


class RoomFeatures(BaseModel):
    chat: bool
    dice: bool


class RoomInfoSet(BaseModel):
    name: str
    creator: str
    invitationCode: str
    isLocked: bool
    clientUrl: str
    features: RoomFeatures
    mods: list[ApiModMeta]
