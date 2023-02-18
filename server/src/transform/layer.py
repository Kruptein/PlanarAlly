from ..api.models.floor import ApiGroup, ApiLayer
from ..api.models.shape import ApiShape
from ..db.models.layer import Layer
from ..db.models.shape import Shape
from ..db.models.user import User
from .shape import transform_shape


def transform_layer(layer: Layer, user: User, dm: bool) -> ApiLayer:
    groups_added: set[str] = set()
    groups: list[ApiGroup] = []
    shapes: list[ApiShape] = []
    for shape in layer.shapes.order_by(Shape.index):
        shapes.append(transform_shape(shape, user, dm))
        if shape.group and shape.group.uuid not in groups_added:
            groups_added.add(shape.group.uuid)
            groups.append(shape.group.as_pydantic())

    return ApiLayer(
        name=layer.name,
        type_=layer.type_,
        player_editable=layer.player_editable,
        selectable=layer.selectable,
        index=layer.index,
        groups=groups,
        shapes=shapes,
    )
