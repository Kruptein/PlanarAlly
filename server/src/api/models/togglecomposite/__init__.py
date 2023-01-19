from pydantic import BaseModel


class ToggleCompositeVariant(BaseModel):
    shape: str
    variant: str


class ToggleCompositeNewVariant(ToggleCompositeVariant):
    name: str
