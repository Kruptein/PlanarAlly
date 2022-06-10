import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom
from state.game import game_state


@sio.on("User.ColourHistory.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_colour_history(sid: str, data: str):
    pr: PlayerRoom = game_state.get(sid)

    pr.player.colour_history = data
    pr.player.save()

    for psid in game_state.get_sids(player=pr.player, skip_sid=sid):
        await sio.emit("User.ColourHistory.Set", data, room=psid, namespace=GAME_NS)
