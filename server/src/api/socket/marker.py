from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.marker import Marker
from ...db.models.player_room import PlayerRoom
from ...state.game import game_state


@sio.on("Marker.New", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def new_marker(sid: str, data):
    pr: PlayerRoom = game_state.get(sid)

    marker = Marker.get_or_none(shape=data, user=pr.player)

    if marker is not None:
        return

    Marker.create(shape=data, user=pr.player, location=pr.active_location)


@sio.on("Marker.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_marker(sid: str, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    marker = Marker.get_or_none(shape_id=uuid, user=pr.player)
    if not marker:
        return

    marker.delete_instance()
