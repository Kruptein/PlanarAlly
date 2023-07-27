from ...api.models.floor import ApiFloor
from ...db.models.floor import Floor
from ...db.models.layer import Layer
from ...db.models.player_room import PlayerRoom
from ...models.role import Role
from .layer import transform_layer


def transform_floor(floor: Floor, pr: PlayerRoom) -> ApiFloor:
    layer_query = floor.layers.order_by(Layer.index)
    if pr.role != Role.DM:
        layer_query = layer_query.where(Layer.player_visible)

    layers = [transform_layer(layer, pr) for layer in layer_query]

    return ApiFloor(
        index=floor.index,
        name=floor.name,
        player_visible=floor.player_visible,
        type_=floor.type_,
        background_color=floor.background_color,
        layers=layers,
    )
