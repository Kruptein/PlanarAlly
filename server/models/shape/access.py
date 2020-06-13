from models.campaign import Floor, Layer, Location, PlayerRoom, Room, User
from models.role import Role
from models.shape import Shape, ShapeOwner


def has_ownership(shape: Shape, pr: PlayerRoom) -> bool:
    if shape is None:
        return False

    if pr.role == Role.DM:
        return True

    if not shape.layer.player_editable:
        return False

    if shape.default_edit_access:
        return True

    return ShapeOwner.get_or_none(shape=shape, user=pr.player) is not None


def has_ownership_temp(shape: Shape, pr: PlayerRoom) -> bool:
    if shape is None:
        return False

    if pr.role == Role.DM:
        return True

    floor: Floor = pr.active_location.floors.select().where(
        Floor.name == shape["floor"]
    )[0]
    layer: Layer = floor.layers.where(Layer.name == shape["layer"])[0]

    if not layer.player_editable:
        return False

    if shape["default_edit_access"]:
        return True

    return any(pr.player.name == o["user"] for o in shape["owners"])
