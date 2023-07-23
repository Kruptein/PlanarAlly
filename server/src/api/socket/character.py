from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.character import Character
from ...db.models.shape import Shape
from ...logs import logger
from ...models.access import has_ownership
from ...state.game import game_state
from ..helpers import _send_game
from ..models.character import CharacterCreate


@sio.on("Character.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_layer(sid: str, raw_data: Any):
    data = CharacterCreate(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_by_id(data.shape)

    if shape is None or shape.asset is None:
        logger.error("Attempt to create character for incorrect shape")
        return
    elif not has_ownership(shape, pr):
        logger.warn("Attempt to create character without access")
        return

    try:
        char = Character.create(
            name=data.name, owner=pr.player, campaign=pr.room, asset=shape.asset
        )
    except:
        logger.exception("Failed to create character")
        return
    else:
        shape.character = char
        shape.save()

    for psid, ppr in game_state.get_t(room=pr.room):
        if has_ownership(shape, ppr):
            await _send_game(
                "Character.Created",
                char.as_pydantic(),
                room=psid,
            )
