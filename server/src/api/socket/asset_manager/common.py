from typing import List
from typing_extensions import TypedDict

from ....utils import FILE_DIR


class UploadData(TypedDict):
    uuid: str
    name: str
    directory: int
    newDirectories: List[str]
    slice: int
    totalSlices: int
    data: bytes
