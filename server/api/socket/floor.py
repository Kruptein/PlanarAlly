import auth
from app import app, logger, sio, state

from models import Floor, Room


@sio.on("Floor.Create", namespace="/planarally")
@auth.login_required(app, sio)
async def create_floor(sid, data):
    sid_data = state.sid_map[sid]
    user = sid_data["user"]
    room: Room = sid_data["room"]
    location = sid_data["location"]

    if room.creator != user:
        logger.warning(f"{user.name} attempted to create a new floor")
        return

    floor: Floor = location.create_floor(data["name"])

    data["floors"] = [
        f.as_dict(user, user == room.creator)
        for f in location.floors.order_by(Floor.index)
    ]

    for psid, player in state.get_players(room=room):
        await sio.emit(
            "Board.Floors.Add",
            floor.as_dict(player, player == room.creator),
            room=psid,
            namespace="/planarally",
        )
