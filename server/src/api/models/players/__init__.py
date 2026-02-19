from ..common import PositionTupleWithFloor
from .info import *
from .options import *
from .role import *


class PlayersPositionSet(PositionTupleWithFloor):
    players: list[str]
