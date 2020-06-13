from typing import Any, Dict, Generator, Set, Tuple

from . import State
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom, User


class GameState(State[PlayerRoom]):
    def __init__(self) -> None:
        super().__init__()
        self.client_temporaries: Dict[int, Set[str]] = {}

    def get_user(self, sid: int) -> User:
        return self._sid_map[sid].player

    async def remove_sid(self, sid: int) -> None:
        await self.clear_temporaries(sid)
        await super().remove_sid(sid)

    async def clear_temporaries(self, sid: int) -> None:
        if sid in self.client_temporaries:
            await sio.emit(
                "Temp.Clear", list(self.client_temporaries[sid]), namespace=GAME_NS,
            )
            del self.client_temporaries[sid]

    def add_temp(self, sid: int, uid: str) -> None:
        if sid not in self.client_temporaries:
            self.client_temporaries[sid] = set()
        self.client_temporaries[sid].add(uid)

    def remove_temp(self, sid: int, uid: str) -> None:
        self.client_temporaries[sid].remove(uid)


game_state = GameState()
app["state"]["game"] = game_state
