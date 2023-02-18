from ..api.models.floor import ApiFloor, ApiLayer
from ..db.models.floor import Floor
from ..db.models.layer import Layer
from ..db.models.user import User
from .layer import transform_layer


def transform_floor(floor: Floor, user: User, dm: bool) -> ApiFloor:
    layers: list[ApiLayer]
    if dm:
        layers = [
            transform_layer(layer, user, True)
            for layer in floor.layers.order_by(Layer.index)
        ]
    else:
        layers = [
            transform_layer(layer, user, False)
            for layer in floor.layers.order_by(Layer.index).where(Layer.player_visible)
        ]
    return ApiFloor(
        index=floor.index,
        name=floor.name,
        player_visible=floor.player_visible,
        type_=floor.type_,
        background_color=floor.background_color,
        layers=layers,
    )
