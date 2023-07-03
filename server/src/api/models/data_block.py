from pydantic import BaseModel


class ApiDataBlockDescription(BaseModel):
    source: str
    name: str


class ApiDataBlock(ApiDataBlockDescription):
    data: str
