from typing import Optional

from .... import stats
from ....db.create.floor import create_floor
from ....db.db import db
from ....db.models.location import Location
from ....db.models.location_options import LocationOptions
from ....db.models.player_room import PlayerRoom
from ....db.models.room import Room
from ....db.models.user import User
from ....models.role import Role


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
        create_floor(loc, "ground")
        PlayerRoom.create(player=user, room=room, role=Role.DM, active_location=loc)
        room.save()

    stats.events.campaign_created(room.id, user.id)

    return room
