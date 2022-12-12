from typing import Optional
from typing_extensions import TypedDict


class Viewport(TypedDict):
    height: int
    width: int
    offset_x: Optional[int]
    offset_y: Optional[int]
