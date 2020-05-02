from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, Generic, Set, Tuple, TypeVar

from app import sio
from models import User


T = TypeVar("T")


class State(ABC, Generic[T]):
    def __init__(self) -> None:
        self._sid_map: Dict[int, T] = {}

    async def add_sid(self, sid: int, value: T) -> None:
        self._sid_map[sid] = value

    async def remove_sid(self, sid: int) -> None:
        del self._sid_map[sid]

    def has_sid(self, sid: int) -> bool:
        return sid in self._sid_map

    def get(self, sid: int) -> T:
        return self._sid_map[sid]

    @abstractmethod
    def get_user(self, sid: int) -> User:
        pass

    def get_sids(self, skip_sid=None, **options) -> Generator[int, None, None]:
        for sid, value in dict(self._sid_map).items():
            if skip_sid == sid:
                continue

            if all(
                getattr(self.get(sid), option, None) == value
                for option, value in options.items()
            ):
                yield sid

    def get_users(self, **options) -> Generator[Tuple[int, User], None, None]:
        for sid in self.get_sids(**options):
            yield sid, self.get_user(sid)
