from pydantic import Field

from ..helpers import TypeIdModel


class ApiCharacter(TypeIdModel):
    id: int = Field(json_schema_extra={"typeId": "CharacterId"})
    name: str
    shapeId: str = Field(json_schema_extra={"typeId": "GlobalId"})
    assetId: int = Field(json_schema_extra={"typeId": "AssetId"})
    assetHash: str


class CharacterCreate(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    name: str
