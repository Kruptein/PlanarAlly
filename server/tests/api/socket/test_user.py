import asyncio
import json
from random import choice
from typing import Awaitable, Callable

import pytest
import socketio

from src.api.socket.constants import GAME_NS
from src.db.models.user import User

ClientTuple = tuple[socketio.AsyncClient, asyncio.Future]
ClientBuilder = Callable[[str, str], Awaitable[ClientTuple]]


BLACK = "rgb(0, 0, 0)"
WHITE = "rgb(255, 255, 255)"
RED = "rgb(255, 0, 0)"
COLOURS = [BLACK, WHITE, RED]


@pytest.mark.asyncio
async def test_colour_history(client: ClientBuilder):
    """Verify User.ColourHistory"""

    # Setup
    sio, fut = await client("test", GAME_NS)
    _, fut2 = await client("test", GAME_NS)
    _, fut3 = await client("darragh", GAME_NS)

    new_history = json.dumps([choice(COLOURS) for _ in range(20)])

    # Trigger
    await sio.emit("User.ColourHistory.Set", new_history, namespace=GAME_NS)

    # Await
    await asyncio.wait_for(fut2, 1.0)

    # Assert

    # Only other connected sids from the same User should receive an update
    assert fut2.done() is True
    assert fut.done() is False
    assert fut3.done() is False

    # The data sent to client2 should be correct
    event, data = fut2.result()
    assert event == "User.ColourHistory.Set"
    assert data == new_history

    # The data in the database should be correctly modified
    u = User.by_name("test")
    assert u.colour_history == new_history
