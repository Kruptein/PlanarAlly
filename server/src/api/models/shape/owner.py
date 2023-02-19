from pydantic import Field

from ..helpers import TypeIdModel


class ApiDefaultShapeOwner(TypeIdModel):
    edit_access: bool
    movement_access: bool
    vision_access: bool
    shape: str = Field(typeId="GlobalId")


class ApiShapeOwner(ApiDefaultShapeOwner):
    user: str
