from typing import cast
from typing_extensions import Any

from peewee import TextField

from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiFontAwesomeShape
from .base_rect import BaseRect


class FontAwesome(BaseRect):
    id: int

    icon_prefix = cast(str, TextField())
    icon_name = cast(str, TextField())

    @staticmethod
    def pre_create(data_dict: dict[Any, Any], reduced_dict: dict[Any, Any]) -> dict[Any, Any]:
        return {**reduced_dict, "icon_prefix": data_dict["iconPrefix"], "icon_name": data_dict["iconName"]}

    def as_pydantic(self, shape: ApiCoreShape):
        return ApiFontAwesomeShape(
            **shape.model_dump(),
            iconPrefix=self.icon_prefix,
            iconName=self.icon_name,
            width=self.width,
            height=self.height,
        )
