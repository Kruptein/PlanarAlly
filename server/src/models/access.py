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

    return ShapeOwner.get_or_none(shape=shape, user=pr.player) is not None
