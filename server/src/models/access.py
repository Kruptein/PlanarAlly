from ..db.models.player_room import PlayerRoom
from ..db.models.shape import Shape
from ..db.models.shape_owner import ShapeOwner
from ..logs import logger
from .role import Role


def has_ownership(shape: Shape, pr: PlayerRoom, *, edit=False, movement=False, vision=False) -> bool:
    if shape is None:
        logger.warning("Attempt to check ownership of unknown shape")
        return False

    if pr.role == Role.DM:
        return True

    if shape.composite_parent:
        return has_ownership(shape.composite_parent[0].parent, pr, edit=edit, movement=movement, vision=vision)

    if shape.layer and not shape.layer.player_editable:
        return False

    if edit and shape.default_edit_access:
        return True

    if movement and shape.default_movement_access:
        return True

    if vision and shape.default_vision_access:
        return True

    so = ShapeOwner.get_or_none(shape=shape, user=pr.player)
    if so is None:
        return False
    return (edit and so.edit_access) or (movement and so.movement_access) or (vision and so.vision_access)
