from pydantic import BaseModel

from ..character import ApiCharacter


class ApiDataBlock(BaseModel):
    source: str
    name: str
    data: str


class ApiCharacterDataBlock(BaseModel):
    dataBlock: ApiDataBlock
    character: ApiCharacter
