from typing import Generator, Union

from ....db.models.player_room import PlayerRoom
from ....db.models.shape import Shape
from ....logs import logger
from ....models.access import has_ownership
from ....state.game import game_state


def get_shape_or_none(pr: PlayerRoom, shape_id: str, action: str) -> Union[Shape, None]:
    try:
        shape: Shape = Shape.get(uuid=shape_id)
    except Shape.DoesNotExist as exc:
        logger.warning(
            f"Attempt by {pr.player.name} on unknown shape. {{method: {action}, shape id: {shape_id}}}"
        )
        raise exc

    if not has_ownership(shape, pr, edit=True):
        logger.warning(
            f"Attempt by {pr.player.name} on shape they do not own. {{method: {action}, shape id: {shape_id}}}"
        )
        return None

    return shape


def get_owner_sids(
    pr: PlayerRoom, shape: Shape, skip_sid=None
) -> Generator[str, None, None]:
    for psid in game_state.get_sids(
        active_location=pr.active_location, skip_sid=skip_sid
    ):
        if has_ownership(shape, game_state.get(psid), edit=True):
            yield psid
