from typing import Any, Optional

from socketio import AsyncServer

from api.socket.constants import GAME_NS


async def _send_game(
    sio: AsyncServer, event: str, data: Any, room: str, skip_sid: Optional[str] = None
):
    await sio.emit(event, data, room=room, skip_sid=skip_sid, namespace=GAME_NS)
