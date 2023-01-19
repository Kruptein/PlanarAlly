from pydantic import BaseModel


class GroupMemberBadge(BaseModel):
    uuid: str
    badge: int
