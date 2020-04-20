from models.shape import Shape, ShapeOwner
from models.campaign import Floor, Layer, Room


def has_ownership(shape: Shape, sid_data) -> bool:
    room: Room = sid_data["room"]
    location: Location = sid_data["location"]
    user: User = sid_data["user"]

    if room.creator == user:
        return True

    if not shape.layer.player_editable:
        return False

    if shape.default_edit_access:
        return True

    return ShapeOwner.get_or_none(shape=shape, user=user) is not None


def has_ownership_temp(shape: Shape, sid_data) -> bool:
    room: Room = sid_data["room"]
    location: Location = sid_data["location"]
    user: User = sid_data["user"]

    if room.creator == user:
        return True

    floor: Floor = location.floors.select().where(Floor.name == shape["floor"])[0]
    layer: Layer = floor.layers.where(Layer.name == shape["layer"])[0]

    if not layer.player_editable:
        return False

    if shape["default_edit_access"]:
        return True

    return any(user.name == o["user"] for o in shape["owners"])
