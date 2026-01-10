from pydantic import Field

from ..helpers import TypeIdModel


class GroupMemberBadge(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "GlobalId"})
    badge: int
