from pydantic import Field

from ..helpers import TypeIdModel


class ApiCharacter(TypeIdModel):
    id: int = Field(typeId="CharacterId")
    name: str
    shapeId: str = Field(typeId="GlobalId")
    assetId: int
    assetHash: str


class CharacterCreate(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    name: str


class CharacterLink(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    character: int = Field(typeId="CharacterId")
