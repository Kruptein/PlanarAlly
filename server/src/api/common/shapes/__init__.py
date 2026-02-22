from ....db.db import db
from ....db.models.aura import Aura
from ....db.models.layer import Layer
from ....db.models.shape import Shape
from ....db.models.shape_owner import ShapeOwner
from ....db.models.tracker import Tracker
from ....db.models.user import User
from ....db.utils import get_table, reduce_data_to_model
from ....logs import logger
from ...models.shape import ApiShape


def create_shape(data: ApiShape, *, layer: Layer | None):
    with db.atomic():
        # Shape itself
        data_dict = data.model_dump()
        if layer:
            index = layer.shapes.count()
        else:
            index = 0
        data_dict["layer"] = layer
        shape = Shape.create(index=index, **reduce_data_to_model(Shape, data_dict))
        # Subshape
        type_table = get_table(shape.type_)
        if type_table is None:
            logger.error("UNKNOWN SHAPE TYPE DETECTED")
            return

        subshape = type_table.create(
            shape=shape,
            **type_table.pre_create(data_dict, reduce_data_to_model(type_table, data_dict)),
        )
        type_table.post_create(subshape, **data_dict)
        # Owners
        for owner in data.owners:
            ShapeOwner.create(
                shape=shape,
                user=User.by_name(owner.user),
                edit_access=owner.edit_access,
                movement_access=owner.movement_access,
                vision_access=owner.vision_access,
            )
        # Trackers
        for tracker in data.trackers:
            Tracker.create(**reduce_data_to_model(Tracker, tracker.model_dump()))
        # Auras
        for aura in data.auras:
            Aura.create(**reduce_data_to_model(Aura, aura.model_dump()))

        return shape
