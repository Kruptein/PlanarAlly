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
    # True when this mod is served from a server-owner dev directory rather than an upload.
    dev: bool = False
    # Changes whenever a dev mod's files change, so clients can bypass the module cache.
    reloadToken: str = ""


class ModToml(BaseModel):
    mod: CoreModMeta


class ApiModLink(BaseModel):
    tag: str
    version: str
    hash: str


class ApiModReplace(BaseModel):
    mod: ApiModMeta
    previous: list[ApiModLink]


class ApiDevModsUpdate(BaseModel):
    mods: list[ApiModMeta]
    force: bool = False
