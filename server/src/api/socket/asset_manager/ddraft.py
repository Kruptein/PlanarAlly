import base64
import json

from typing_extensions import TypedDict


class Coord(TypedDict):
    x: int
    y: int


class DDraftPortal(TypedDict):
    position: Coord
    bounds: list[Coord]
    rotation: int
    closed: bool
    freestanding: bool


class DDraftResolution(TypedDict):
    map_origin: Coord
    map_size: Coord
    pixels_per_grid: int


class DDraftData(TypedDict):
    format: str
    resolution: DDraftResolution
    line_of_sight: list[Coord]
    portals: list[DDraftPortal]
    image: str


def get_ddraft_data(data: bytes):
    ddraft_file: DDraftData = json.loads(data)

    image = base64.b64decode(ddraft_file["image"])

    template = {
        "ddraft/uvtt": {
            "width": ddraft_file["resolution"]["map_size"]["x"] * 50,
            "height": ddraft_file["resolution"]["map_size"]["y"] * 50,
            "options": json.dumps([[f"ddraft_{k}", v] for k, v in ddraft_file.items() if k != "image"]),
        }
    }

    return image, template
