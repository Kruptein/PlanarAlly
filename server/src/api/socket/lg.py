from typing_extensions import TypedDict

from ... import auth
from ...app import app, sio
from ...models import PlayerRoom
from ...state.game import game_state
from .constants import GAME_NS


class LgUuidLink(TypedDict):
    typeId: int
    uuid: str


@sio.on("Lg.Token.Connect", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def token_connect(sid: str, data: int):
    pr = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await sio.emit("Lg.Token.Connect", data, room=psid, namespace=GAME_NS)


@sio.on("Lg.Grid.Ids.Show", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def show_grid_ids(sid: str):
    pr = game_state.get(sid)

    await sio.emit(
        "Lg.Grid.Ids.Show", room=pr.room.get_path(), skip_sid=sid, namespace=GAME_NS
    )


@sio.on("Lg.Grid.Ids.Hide", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def hide_grid_ids(sid: str):
    pr = game_state.get(sid)

    await sio.emit(
        "Lg.Grid.Ids.Hide", room=pr.room.get_path(), skip_sid=sid, namespace=GAME_NS
    )
