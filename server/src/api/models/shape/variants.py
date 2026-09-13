from pydantic import Field
from ..helpers import TypeIdModel


# The core info to create a variant
class ApiVariantWithoutId(TypeIdModel):
    name: str | None
    assetId: int = Field(json_schema_extra={"typeId": "AssetId"})
    width: float
    height: float


# The full info to work with a variant
class ApiVariant(ApiVariantWithoutId):
    id: int
    assetHash: str


class ApiAddVariant(ApiVariant):
    shapeId: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ApiCreateVariant(ApiVariantWithoutId):
    shapeId: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ApiVariantIdentifier(TypeIdModel):
    shapeId: str = Field(json_schema_extra={"typeId": "GlobalId"})
    variantId: int
