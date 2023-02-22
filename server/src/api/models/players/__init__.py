from ..common import PositionTuple
from .info import *
from .options import *
from .role import *


class PlayerPosition(PositionTuple):
    floor: str


class PlayersPositionSet(PlayerPosition):
    players: list[str]
