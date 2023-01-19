from typing import Any

from ..models.dice.roll import DiceRollResult

from ..helpers import _send_game

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...models import PlayerRoom
from ...models.role import Role
from ...state.game import game_state


@sio.on("Dice.Roll.Result", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def on_dice_roll(sid: str, raw_data: Any):
    roll_info = DiceRollResult(**raw_data)

    pr: PlayerRoom = game_state.get(sid)
    for p_sid, p_pr in game_state.get_t(room=pr.room):
        if p_sid != sid and (roll_info.shareWithAll or p_pr.role == Role.DM):
            await _send_game("Dice.Roll.Result", roll_info, room=p_sid)
