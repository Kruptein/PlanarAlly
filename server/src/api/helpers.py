from typing import Any, Literal, Optional

from ..app import sio
from ..logs import logger
from .socket.constants import ASSET_NS, GAME_NS


async def _send_game(
    event: str,
    data: Any,
    *,
    room: str | None,
    skip_sid: Optional[str] = None,
):
    await sio.emit(event, data, room=room, skip_sid=skip_sid, namespace=GAME_NS)


async def _send_assets(
    event: str,
    data: Any,
    *,
    room: str | None,
    skip_sid: Optional[str] = None,
):
    await sio.emit(event, data, room=room, skip_sid=skip_sid, namespace=ASSET_NS)


async def send_log_toast(
    message: str,
    severity: Literal["warn"],
    room: str | None,
    namespace: str | None,
    skip_sid: str | None = None,
):
    event_name = "Toast."
    if severity == "warn":
        event_name += "Warn"
        logger.warning(message)
    else:
        logger.debug(message)

    await sio.emit(
        event_name, message, room=room, skip_sid=skip_sid, namespace=namespace
    )
