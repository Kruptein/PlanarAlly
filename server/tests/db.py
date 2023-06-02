import tempfile
from pathlib import Path

from src.api.common.rooms.create import create_room
from src.db import db
from src.db.models.player_room import PlayerRoom
from src.db.models.user import User
from src.models.role import Role
from src.save import SAVE_VERSION, create_new_db


def load_test_db():
    f = Path(tempfile.gettempdir()) / "pa-tests.sqlite"
    if f.exists():
        f.unlink()

    create_new_db(db.set_db(f), SAVE_VERSION)

    dm = User.create_new("dm1", "dm")
    dm2 = User.create_new("dm2", "dm")
    p1 = User.create_new("player1", "player")
    p2 = User.create_new("player2", "player")

    create_test_room("test-room", [dm, dm2], [p1, p2])


def create_test_room(name: str, dms: list[str | User], users: list[str | User]):
    _users: list[User] = []
    for user in [*dms, *users]:
        if isinstance(user, str):
            _users.append(User.by_name(user))
        else:
            _users.append(user)

    r = create_room(name, _users[0], -1)
    assert r is not None
    loc = r.locations[0]

    for i, user in enumerate(_users):
        # the first DM already has a PR as part of the room creation itself
        if i == 0:
            continue

        if i < len(dms):
            PlayerRoom.create(
                player=user, room=r, role=Role.DM, active_location=loc
            ).save()
        else:
            PlayerRoom.create(
                player=user, room=r, role=Role.PLAYER, active_location=loc
            ).save()

    return r
