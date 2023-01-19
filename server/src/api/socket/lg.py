from ... import auth
from ...app import app, sio
from ...state.game import game_state
from ..helpers import _send_game
from .constants import GAME_NS


@sio.on("Lg.Token.Connect", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def token_connect(sid: str, data: int):
    pr = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await _send_game("Lg.Token.Connect", data, room=psid)


@sio.on("Lg.Grid.Ids.Show", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def show_grid_ids(sid: str):
    pr = game_state.get(sid)

    await _send_game("Lg.Grid.Ids.Show", None, room=pr.room.get_path(), skip_sid=sid)


@sio.on("Lg.Grid.Ids.Hide", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def hide_grid_ids(sid: str):
    pr = game_state.get(sid)

    await _send_game("Lg.Grid.Ids.Hide", None, room=pr.room.get_path(), skip_sid=sid)
    await _send_game("Lg.Grid.Ids.Hide", None, room=pr.room.get_path(), skip_sid=sid)
