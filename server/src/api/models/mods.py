from pydantic import BaseModel


class CoreModMeta(BaseModel):
    apiSchema: str
    tag: str
    name: str
    version: str
    author: str
    shortDescription: str
    description: str


class ApiModMeta(CoreModMeta):
    hash: str
    hasCss: bool


class ApiModLink(BaseModel):
    tag: str
    version: str
    hash: str
