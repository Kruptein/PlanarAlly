from typing import Any, Optional

from ..app import sio
from .socket.constants import GAME_NS


async def _send_game(
    event: str,
    data: Any,
    *,
    room: str | None,
    skip_sid: Optional[str] = None,
):
    await sio.emit(event, data, room=room, skip_sid=skip_sid, namespace=GAME_NS)
