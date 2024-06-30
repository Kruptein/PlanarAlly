from typing import Any

import aiohttp

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.player_room import PlayerRoom
from ...state.game import game_state
from ..helpers import _send_game
from ..models.chat import ApiChatMessage, ApiChatMessageUpdate


async def is_image(session: aiohttp.ClientSession, url: str) -> bool:
    async with session.head(url) as resp:
        if resp.status == 200:
            return resp.headers.get("Content-Type", "").startswith("image/")
    return False


@sio.on("Chat.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_chat_message(sid: str, raw_data: Any):
    data = ApiChatMessage(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    await _send_game("Chat.Add", data, room=pr.room.get_path(), skip_sid=sid)

    # Check if any of the data parts are images

    image_found = False

    async with aiohttp.ClientSession() as session:
        content = ""
        for part in data.data:
            if content:
                content += " "

            if part.startswith("http") and await is_image(session, part):
                image_found = True
                content += f"![]({part})"
                continue
            content += part

    if image_found:
        await _send_game(
            "Chat.Image.Update",
            ApiChatMessageUpdate(id=data.id, message=content),
            room=pr.room.get_path(),
        )
