import asyncio
from functools import partial

import pytest
import pytest_asyncio
import socketio

from src.db.models.room import Room
from src.db.models.user import User
from src.planarserver import start_http

from .db import create_test_room, load_test_db

load_test_db()

from src.app import app  # noqa: E402

PORT = 8009

## SERVER FIXTURES


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Overrides pytest default function scoped event loop"""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def server():
    """Start server as test fixture and tear down after test"""
    task = asyncio.create_task(start_http(app, "0.0.0.0", PORT))

    yield

    # cleanup pending async tasks, not super clean, but haven't figured out yet what is the root cause here

    tasks = asyncio.all_tasks()
    tasks = [t for t in tasks if not t.done()]
    for task in tasks:
        task.cancel()

    # Wait for all tasks to complete, ignoring any CancelledErrors
    try:
        await asyncio.wait(tasks)
    except asyncio.exceptions.CancelledError:
        pass


## CLIENT FIXTURES


async def handle(event: str, data, f: asyncio.Future):
    f.set_result((event, data))


@pytest_asyncio.fixture
async def client(server):
    # Internal data structure used to cleanup after use
    data = []

    async def _make(username: str, namespace: str, room: str | Room | None = None):
        # Setup sio client
        sio = socketio.AsyncClient()
        await sio.connect(f"http://0.0.0.0:{PORT}", namespaces=namespace)
        sid = sio.get_sid(namespace)

        u = User.by_name(username)

        if room is None:
            room = Room.get(name="test-room")
        elif isinstance(room, str):
            room = Room.get(name=room)

        app["state"]["asset"]._sid_map[sid] = u
        app["state"]["game"]._sid_map[sid] = room.players.filter(player=u)[0]

        # Create a future that we use to set received socket data on
        fut = asyncio.get_running_loop().create_future()

        # Listen to all events on the client socket and set this data on the future
        sio.on("*", partial(handle, f=fut), namespace=namespace)

        ret = (sio, fut)
        data.append(ret)
        return ret

    yield _make

    for sio, fut in data:
        await sio.disconnect()
        fut.cancel()


@pytest.fixture
def create_room(request: pytest.FixtureRequest):
    def _make(
        dms: list[str | User], players: list[str | User], name: str | None = None
    ):
        return create_test_room(name or f"test-{request.node.name}", dms, players)

    yield _make
