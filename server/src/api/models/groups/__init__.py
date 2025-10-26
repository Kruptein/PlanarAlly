from pydantic import BaseModel, Field

from ..helpers import TypeIdModel
from .members import *
from .members import GroupMemberBadge


class GroupJoin(BaseModel):
    group_id: str
    members: list[GroupMemberBadge]


class GroupLeave(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    group_id: str
