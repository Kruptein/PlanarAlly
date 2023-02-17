from ....logs import logger
from ....models import Aura, Shape, ShapeOwner, Tracker, User
from ....models.db import db
from ....models.utils import get_table, reduce_data_to_model
from ...models.shape import ApiShape


def create_shape(data: ApiShape):
    with db.atomic():
        # Shape itself
        shape = Shape.create(**reduce_data_to_model(Shape, data))
        # Subshape
        type_table = get_table(shape.type_)
        if type_table is None:
            logger.error("UNKNOWN SHAPE TYPE DETECTED")
            return

        subshape = type_table.create(
            shape=shape,
            **type_table.pre_create(**reduce_data_to_model(type_table, data)),
        )
        type_table.post_create(subshape, **data.dict())
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
            Tracker.create(**reduce_data_to_model(Tracker, tracker))
        # Auras
        for aura in data.auras:
            Aura.create(**reduce_data_to_model(Aura, aura))

        return shape
