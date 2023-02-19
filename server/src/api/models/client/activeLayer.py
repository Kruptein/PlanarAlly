from pydantic import BaseModel


class ClientActiveLayerSet(BaseModel):
    floor: str
    layer: str
