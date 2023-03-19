import asyncio

import pytest

from src.api.socket.constants import GAME_NS
from src.db.models.room import Room
from src.db.models.user import User

from ...helpers import assert_all_results_same_data
from ...types import ClientBuilder, CreateRoomBuilder


@pytest.mark.asyncio
async def test_invite_code_refresh_player(client: ClientBuilder):
    """Players should not be able to refresh invite codes"""

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
    """A DM should be able to change the invite code"""

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
    results1 = fut.result()
    results2 = fut2.result()
    results3 = fut3.result()
    event, data, count = assert_all_results_same_data([*results1, *results2, *results3])
    assert event == "Room.Info.InvitationCode.Set"
    assert count == 3

    # The data in the database should be modified

    new_invitation_code = Room.get(name="test-room").invitation_code
    assert invitation_code != new_invitation_code
    assert new_invitation_code == data


@pytest.mark.asyncio
async def test_player_kick_player(
    client: ClientBuilder, create_room: CreateRoomBuilder
):
    """Players should not be able to kick another player"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("player1", GAME_NS, r)
    _, fut2 = await client("player1", GAME_NS, r)
    _, fut3 = await client("player2", GAME_NS, r)
    _, fut4 = await client("dm1", GAME_NS, r)

    # Trigger
    await sio.emit(
        "Room.Info.Players.Kick", User.by_name("player2").id, namespace=GAME_NS
    )

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Kicking a player can NOT be initiated by players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The player count in the room should NOT be modified

    assert len(r.players) == 4


@pytest.mark.asyncio
async def test_player_kick_dm(client: ClientBuilder, create_room: CreateRoomBuilder):
    """A DM should be able to kick another player including other DMs"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("dm1", GAME_NS, r)
    _, fut2 = await client("dm1", GAME_NS, r)
    _, fut3 = await client("dm2", GAME_NS, r)
    _, fut4 = await client("player1", GAME_NS, r)

    # Trigger
    await sio.emit(
        "Room.Info.Players.Kick", User.by_name("player1").id, namespace=GAME_NS
    )
    await sio.emit("Room.Info.Players.Kick", User.by_name("dm2").id, namespace=GAME_NS)

    # Await
    await asyncio.wait_for(asyncio.gather(fut3, fut4), 1.0)
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Only the disconnecting user gets a message
    # todo: we probably should be broadcasting this actually?
    assert not fut2.done()

    results3 = fut3.result()
    results4 = fut4.result()
    event, _, count = assert_all_results_same_data([*results3, *results4])
    assert count == 2
    assert event == "disconnect"

    # The player count in the room should be modified

    assert len(r.players) == 2


@pytest.mark.asyncio
async def test_player_kick_creator(
    client: ClientBuilder, create_room: CreateRoomBuilder
):
    """A DM should not be able to kick the creator DM"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("dm1", GAME_NS, r)
    sio2, fut2 = await client("dm2", GAME_NS, r)
    _, fut3 = await client("player1", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Info.Players.Kick", User.by_name("dm1").id, namespace=GAME_NS)
    await sio2.emit("Room.Info.Players.Kick", User.by_name("dm1").id, namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut2, 1.0)

    # Assert

    assert not fut.done()
    assert not fut3.done()

    # The player count in the room should NOT be modified

    assert len(r.players) == 4


@pytest.mark.asyncio
async def test_player_kick_wrong_room(
    client: ClientBuilder, create_room: CreateRoomBuilder
):
    """Removing a player from a Room they are not part of, should have no effect on the room."""
    # Setup
    r = create_room(["dm1", "dm2"], ["player2"])
    sio, fut = await client("dm1", GAME_NS, r)
    _, fut2 = await client("dm1", GAME_NS, r)
    _, fut3 = await client("dm2", GAME_NS, r)
    _, fut4 = await client("player1", GAME_NS)

    # Trigger
    await sio.emit(
        "Room.Info.Players.Kick", User.by_name("player1").id, namespace=GAME_NS
    )

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Kicking a player can NOT be initiated by players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The player count in the room should NOT be modified

    assert len(r.players) == 3


@pytest.mark.asyncio
async def test_room_delete_player(
    client: ClientBuilder, create_room: CreateRoomBuilder
):
    """Deleting a room should not be possible as a player"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("player1", GAME_NS, r)
    _, fut2 = await client("player1", GAME_NS, r)
    _, fut3 = await client("player2", GAME_NS, r)
    _, fut4 = await client("dm1", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Delete", namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # Removing a campaign can NOT be initiated by players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The player count in the room should NOT be modified

    assert len(r.players) == 4
    assert Room.get_or_none(name=r.name) is not None


@pytest.mark.asyncio
async def test_room_delete_dm(client: ClientBuilder, create_room: CreateRoomBuilder):
    """Deleting a room should be possible by a DM"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("dm1", GAME_NS, r)
    _, fut2 = await client("dm1", GAME_NS, r)
    _, fut3 = await client("dm2", GAME_NS, r)
    _, fut4 = await client("player1", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Delete", namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # The remove just happens instantly without any disconnecting of current players :4
    # todo: we probably should be disconnecting active players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # The player count in the room should be modified

    assert Room.get_or_none(name=r.name) is None


@pytest.mark.asyncio
async def test_lock_room_player(client: ClientBuilder, create_room: CreateRoomBuilder):
    """Locking a room should not be possible by a player"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("player1", GAME_NS, r)
    _, fut2 = await client("player1", GAME_NS, r)
    _, fut3 = await client("player2", GAME_NS, r)
    _, fut4 = await client("dm1", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Info.Set.Locked", True, namespace=GAME_NS)

    # Await
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    # can NOT be initiated by players
    assert not fut2.done()
    assert not fut3.done()
    assert not fut4.done()

    # Make sure lock has not been set

    assert not Room.get_or_none(name=r.name).is_locked


@pytest.mark.asyncio
async def test_lock_room_dm(client: ClientBuilder, create_room: CreateRoomBuilder):
    """Locking a room should be possible by a DM"""
    # Setup
    r = create_room(["dm1", "dm2"], ["player1", "player2"])
    sio, fut = await client("dm1", GAME_NS, r)
    _, fut2 = await client("dm1", GAME_NS, r)
    _, fut3 = await client("dm2", GAME_NS, r)
    _, fut4 = await client("player1", GAME_NS, r)
    _, fut5 = await client("player2", GAME_NS, r)

    # Trigger
    await sio.emit("Room.Info.Set.Locked", True, namespace=GAME_NS)

    # Await

    await asyncio.wait_for(asyncio.gather(fut4, fut5), 1.0)
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(fut, 1.0)

    # Assert

    assert not fut2.done()
    assert not fut3.done()

    # The player count in the room should be modified

    assert Room.get_or_none(name=r.name).is_locked
