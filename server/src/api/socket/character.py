from typing import Any

from playhouse.shortcuts import model_to_dict

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.character import Character
from ...db.models.shape import Shape
from ...logs import logger
from ...state.game import game_state
from ..helpers import _send_game
from ..models.character import CharacterCreate, CharacterLink


@sio.on("Character.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_layer(sid: str, raw_data: Any):
    data = CharacterCreate(**raw_data)

    pr = game_state.get(sid)

    s = Shape.get_by_id(data.shape)

    if s is None or s.asset is None:
        logger.error("Attempt to create character for incorrect shape")

    try:
        char = Character.create(
            name=data.name, owner=pr.player, campaign=pr.room, asset=s.asset
        )
    except:
        logger.exception("Failed to create character")
    else:
        s.character = char
        s.save()
        await _send_game(
            "Character.Created",
            model_to_dict(char, recurse=False),
            room=pr.room.get_path(),
        )
        await _send_game(
            "Character.Link",
            CharacterLink(shape=s.uuid, character=char.id),
            room=pr.room.get_path(),
        )
