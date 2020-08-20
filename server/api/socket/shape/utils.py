from typing import Union

from models import PlayerRoom, Shape
from models.shape.access import has_ownership
from utils import logger


def get_shape_or_none(pr: PlayerRoom, shape_id: str, action: str) -> Union[Shape, None]:
    try:
        shape: Shape = Shape.get(uuid=shape_id)
    except Shape.DoesNotExist as exc:
        logger.warning(
            f"Attempt by {pr.player.name} on unknown shape. {{method: {action}, shape id: {shape_id}}}"
        )
        raise exc

    if not has_ownership(shape, pr):
        logger.warning(
            f"Attempt by {pr.player.name} on shape they do not own. {{method: {action}, shape id: {shape_id}}}"
        )
        return None

    return shape
