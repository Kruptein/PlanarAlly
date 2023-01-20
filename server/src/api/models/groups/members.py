from pydantic import Field

from ..helpers import TypeIdModel


class GroupMemberBadge(TypeIdModel):
    uuid: str = Field(typeId="GlobalId")
    badge: int
