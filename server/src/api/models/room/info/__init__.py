from pydantic import BaseModel

from .player import *


class RoomFeatures(BaseModel):
    chat: bool
    dice: bool


class RoomInfoSet(BaseModel):
    name: str
    creator: str
    invitationCode: str
    isLocked: bool
    publicName: str
    features: RoomFeatures
