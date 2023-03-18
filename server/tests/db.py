import tempfile
from pathlib import Path

from src.api.common.rooms.create import create_room
from src.db import db
from src.db.models.player_room import PlayerRoom
from src.db.models.user import User
from src.models.role import Role


def load_test_db():
    db.open_db(Path(tempfile.gettempdir()) / "pa-tests.sqlite")
    dm = User.create_new("dm1", "dm")
    dm2 = User.create_new("dm2", "dm")
    p1 = User.create_new("player1", "player")
    p2 = User.create_new("player2", "player")

    r = create_room("test-room", dm, -1)
    assert r is not None
    loc = r.locations[0]

    PlayerRoom.create(player=dm2, room=r, role=Role.DM, active_location=loc).save()
    PlayerRoom.create(player=p1, room=r, role=Role.PLAYER, active_location=loc).save()
    PlayerRoom.create(player=p2, room=r, role=Role.PLAYER, active_location=loc).save()
