from typing import cast

from peewee import TextField

from ...api.models.shape import ApiShape
from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiToggleCompositeShape, ToggleVariant
from .composite_shape_association import CompositeShapeAssociation
from .shape_type import ShapeType


class ToggleComposite(ShapeType):
    """
    Toggle shapes are composites that have multiple variants but only show one at a time.
    """

    active_variant = cast(str | None, TextField(null=True))

    @staticmethod
    def post_create(subshape, **kwargs):
        for variant in kwargs.get("variants", []):
            CompositeShapeAssociation.create(parent=subshape, variant=variant["uuid"], name=variant["name"])

    def as_pydantic(self, shape: ApiCoreShape) -> ApiShape:
        return ApiToggleCompositeShape(
            **shape.model_dump(),
            active_variant=self.active_variant,
            variants=[ToggleVariant(uuid=sv.variant.uuid, name=sv.name) for sv in self.shape.shape_variants],
        )
