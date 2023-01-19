from pydantic import BaseModel

from .members import *
from .members import GroupMemberBadge


class GroupJoin(BaseModel):
    group_id: str
    members: list[GroupMemberBadge]


class GroupLeave(BaseModel):
    uuid: str
    group_id: str
