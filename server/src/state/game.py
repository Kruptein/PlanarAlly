from typing import Dict, Set

from ..api.models.client import Viewport
from ..api.socket.constants import GAME_NS
from ..app import app, sio
from ..db.models.player_room import PlayerRoom
from ..db.models.user import User
from . import State


class GameState(State[PlayerRoom]):
    def __init__(self) -> None:
        super().__init__(GAME_NS)
        self.client_temporaries: Dict[str, Set[str]] = {}
        self.client_viewports: Dict[str, Viewport] = {}

    def get_user(self, sid: str) -> User:
        return self._sid_map[sid].player

    async def remove_sid(self, sid: str) -> None:
        await self.clear_temporaries(sid)
        if sid in self.client_viewports:
            del self.client_viewports[sid]
        await super().remove_sid(sid)

    async def clear_temporaries(self, sid: str) -> None:
        if sid in self.client_temporaries:
            await sio.emit(
                "Temp.Clear",
                list(self.client_temporaries[sid]),
                namespace=self.namespace,
            )
            if sid in self.client_temporaries:
                del self.client_temporaries[sid]

    def add_temp(self, sid: str, uid: str) -> None:
        if sid not in self.client_temporaries:
            self.client_temporaries[sid] = set()
        self.client_temporaries[sid].add(uid)

    def remove_temp(self, sid: str, uid: str) -> None:
        self.client_temporaries[sid].remove(uid)


game_state = GameState()
app["state"]["game"] = game_state
