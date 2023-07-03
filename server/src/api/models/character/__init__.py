from pydantic import BaseModel

from ..data_block import ApiDataBlock


class ApiCharacter(BaseModel):
    id: int
    name: str
    dataBlocks: list[ApiDataBlock]
