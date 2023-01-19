from ... import auth
from ...app import app, sio
from ...models import PlayerRoom
from ...state.game import game_state
from ..helpers import _send_game
from .constants import GAME_NS


@sio.on("User.ColourHistory.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_colour_history(sid: str, data: str):
    pr: PlayerRoom = game_state.get(sid)

    pr.player.colour_history = data
    pr.player.save()

    for psid in game_state.get_sids(player=pr.player, skip_sid=sid):
        await _send_game("User.ColourHistory.Set", data, room=psid)
