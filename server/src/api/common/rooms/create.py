from typing import Optional

from ....models.campaign import Location, LocationOptions, PlayerRoom, Room
from ....models.db import db
from ....models.role import Role
from ....models.user import User


def create_room(name: str, user: User, logo: int) -> Optional[Room]:
    if Room.get_or_none(name=name, creator=user):
        return None

    with db.atomic():
        default_options = LocationOptions.create()
        room = Room.create(
            name=name,
            creator=user,
            default_options=default_options,
        )

        if logo >= 0:
            room.logo_id = logo

        loc = Location.create(room=room, name="start", index=1)
        loc.create_floor()
        PlayerRoom.create(player=user, room=room, role=Role.DM, active_location=loc)
        room.save()

    return room
