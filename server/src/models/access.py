from ..db.models.player_room import PlayerRoom
from ..db.models.shape import Shape
from ..db.models.shape_owner import ShapeOwner
from .role import Role


def has_ownership(shape: Shape, pr: PlayerRoom, movement=False) -> bool:
    if shape is None:
        return False

    if pr.role == Role.DM:
        return True

    if not shape.layer.player_editable:
        return False

    if shape.default_edit_access:
        return True

    if movement and shape.default_movement_access:
        return True

    so = ShapeOwner.get_or_none(shape=shape, user=pr.player)
    if so is None:
        return False
    return so.edit_access or (movement and so.movement_access)
