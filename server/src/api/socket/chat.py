from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.player_room import PlayerRoom
from ...state.game import game_state
from ..helpers import _send_game
from ..models.chat import ApiChatMessage


@sio.on("Chat.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_chat_message(sid: str, raw_data: Any):
    data = ApiChatMessage(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    await _send_game("Chat.Add", data, room=pr.room.get_path(), skip_sid=sid)
