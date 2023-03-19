import asyncio

import pytest

from src.api.socket.constants import GAME_NS
from src.db.models.room import Room

from ...types import ClientBuilder, CreateRoomBuilder


@pytest.mark.asyncio
async def test_invite_code_refresh_player(client: ClientBuilder):
    """Room.Info.InviteCode.Refresh"""

    invitation_code = Room.get(name="test-room").invitation_code

    # Setup
    sio, fut = await client("player1", GAME_NS)
    _, fut2 = await client("player1", GAME_NS)
    _, fut3 = await client("dm1", GAME_NS)
    _, fut4 = await client("player2", GAME_NS)

    # Trigger
    await sio.emit("Room.Info.InviteCode.Refresh", namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Players cannot trigger invitecode changes
    # so nothing should have happened on the other futures
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The data in the database should NOT be modified

    assert invitation_code == Room.get(name="test-room").invitation_code


@pytest.mark.asyncio
async def test_invite_code_refresh_dm(client: ClientBuilder):
    """Room.Info.InviteCode.Refresh"""

    invitation_code = Room.get(name="test-room").invitation_code

    # Setup
    sio, fut = await client("dm1", GAME_NS)
    _, fut2 = await client("dm1", GAME_NS)
    _, fut3 = await client("dm2", GAME_NS)
    _, fut4 = await client("player1", GAME_NS)

    # Trigger
    await sio.emit("Room.Info.InviteCode.Refresh", namespace=GAME_NS)

    # Await
    await asyncio.wait_for(asyncio.gather(fut, fut2, fut3), 1.0)

    # Invite code updates should NOT be received by players
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut4, 1.0)

    # Assert
    e1, d1 = fut.result()
    e2, d2 = fut2.result()
    e3, d3 = fut3.result()
    assert e1 == e2 == e3 == "Room.Info.InvitationCode.Set"
    assert d1 == d2 == d3

    # The data in the database should be modified

    new_invitation_code = Room.get(name="test-room").invitation_code
    assert invitation_code != new_invitation_code
    assert new_invitation_code == d2


@pytest.mark.asyncio
async def test_player_kick_player(
    client: ClientBuilder, create_room: CreateRoomBuilder
):
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("player1", GAME_NS, r)
    _, fut2 = await client("player1", GAME_NS, r)
    _, fut3 = await client("player2", GAME_NS, r)
    _, fut4 = await client("dm1", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Info.Players.Kick", namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Kicking a player can NOT be initiated by players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The data in the database should be modified

    assert len(r.players) == 4
