import asyncio
from typing import Protocol

import socketio

from src.db.models.room import Room
from src.db.models.user import User

ClientTuple = tuple[socketio.AsyncClient, asyncio.Future]


class ClientBuilder(Protocol):
    async def __call__(
        self, username: str, namespace: str, room: str | Room | None = ...
    ) -> ClientTuple:
        ...


class CreateRoomBuilder(Protocol):
    def __call__(
        self,
        dms: list[str | User],
        players: list[str | User],
        name: str | None = ...,
    ) -> Room:
        ...
