from ...api.models.shape.shape import ApiCoreShape
from ...api.models.shape.subtypes import ApiRectShape
from .base_rect import BaseRect


class Rect(BaseRect):
    def as_pydantic(self, shape: ApiCoreShape):
        return ApiRectShape(**shape.dict(), width=self.width, height=self.height)
