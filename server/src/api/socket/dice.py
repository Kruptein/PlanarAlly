from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import PlayerRoom
from models.role import Role
from state.game import game_state


class RollInfo(TypedDict):
    player: str
    roll: str
    result: int
    shareWithAll: bool


@sio.on("Dice.Roll.Result", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def on_dice_roll(sid: str, roll_info: RollInfo):
    pr: PlayerRoom = game_state.get(sid)
    for p_sid, p_pr in game_state.get_t(room=pr.room):
        if p_sid != sid and (roll_info["shareWithAll"] or p_pr.role == Role.DM):
            await sio.emit(
                "Dice.Roll.Result", data=roll_info, room=p_sid, namespace=GAME_NS
            )
