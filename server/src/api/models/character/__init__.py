from pydantic import BaseModel, Field

from ..data_block import ApiDataBlock
from ..helpers import TypeIdModel


class ApiCharacter(BaseModel):
    id: int
    name: str
    dataBlocks: list[ApiDataBlock]


class CharacterCreate(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    name: str


class CharacterLink(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    character: int
