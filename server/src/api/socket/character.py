from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.character import Character
from ...db.models.shape import Shape
from ...logs import logger
from ...models.access import has_ownership
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.character import CharacterCreate


@sio.on("Character.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_character(sid: str, raw_data: Any):
    data = CharacterCreate(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_by_id(data.shape)

    if shape is None or shape.asset is None:
        logger.error("Attempt to create character for incorrect shape")
        return
    elif not has_ownership(shape, pr, edit=True):
        logger.warning("Attempt to create character without access")
        return
    elif shape.character_id is not None:
        logger.warning("Shape is already associated with a character")
        return

    try:
        char = Character.create(name=data.name, owner=pr.player, campaign=pr.room, asset=shape.asset)
    except:
        logger.exception("Failed to create character")
        return
    else:
        shape.character = char
        shape.save()

    for psid, ppr in game_state.get_t(room=pr.room):
        if has_ownership(shape, ppr, edit=True):
            await _send_game(
                "Character.Created",
                char.as_pydantic(),
                room=psid,
            )


@sio.on("Character.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_character(sid: str, char_id: int):
    pr = game_state.get(sid)

    character = Character.get_by_id(char_id)

    if character is None:
        logger.error("Attempt to remove unknown character")
        return
    elif character.campaign != pr.room:
        logger.error("Attempt to remove character from other campaign")
        return
    # Only the owner and the DM can remove a character
    elif character.owner != pr.player and pr.role != Role.DM:
        logger.error("Attempt to remove character by player without access")
        return

    shape = character.shape

    for psid, ppr in game_state.get_t(room=pr.room):
        if has_ownership(shape, ppr, edit=True):
            await _send_game(
                "Character.Removed",
                char_id,
                room=psid,
            )

    # If the associated shape is not placed anywhere, remove it as well
    if character.shape.layer is None:
        character.shape.delete_instance(True)

    character.delete_instance(True)
