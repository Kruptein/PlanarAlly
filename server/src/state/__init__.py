import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Generator, Generic, Tuple, TypeVar

from ..app import sio
from ..db.models.user import User

T = TypeVar("T")


class State(ABC, Generic[T]):
    def __init__(self, namespace: str | None) -> None:
        self._sid_map: Dict[str, T] = {}
        self.namespace = namespace

    async def disconnect_all(self) -> None:
        if self.namespace is None:
            return

        await asyncio.gather(
            *[
                sio.disconnect(sid, namespace=self.namespace)
                for sid in self._sid_map.keys()
            ]
        )

    async def add_sid(self, sid: str, value: T) -> None:
        self._sid_map[sid] = value

    async def remove_sid(self, sid: str) -> None:
        del self._sid_map[sid]

    def has_sid(self, sid: str) -> bool:
        return sid in self._sid_map

    def get(self, sid: str) -> T:
        return self._sid_map[sid]

    @abstractmethod
    def get_user(self, sid: str) -> User:
        pass

    def get_sids(self, skip_sid=None, **options) -> Generator[str, None, None]:
        for sid, value in dict(self._sid_map).items():
            if skip_sid == sid:
                continue

            if all(
                getattr(self.get(sid), option, None) == value
                for option, value in options.items()
            ):
                yield sid

    def get_t(self, **options) -> Generator[Tuple[str, T], None, None]:
        for sid in self.get_sids(**options):
            yield sid, self.get(sid)

    def get_users(self, **options) -> Generator[Tuple[str, User], None, None]:
        for sid in self.get_sids(**options):
            yield sid, self.get_user(sid)
