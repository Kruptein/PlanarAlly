from typing import List
from typing_extensions import TypedDict


class UploadData(TypedDict):
    uuid: str
    name: str
    directory: int
    newDirectories: List[str]
    slice: int
    totalSlices: int
    data: bytes
