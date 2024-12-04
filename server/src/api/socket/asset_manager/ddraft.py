import base64
import hashlib
import json
from typing import List

from typing_extensions import TypedDict

from ....app import sio
from ....db.models.asset import Asset
from ....state.asset import asset_state
from ....transform.to_api.asset import transform_asset
from ....utils import ASSETS_DIR, get_asset_hash_subpath
from ...models.asset import ApiAssetUpload
from ..constants import ASSET_NS


class Coord(TypedDict):
    x: int
    y: int


class DDraftPortal(TypedDict):
    position: Coord
    bounds: List[Coord]
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
    line_of_sight: List[Coord]
    portals: List[DDraftPortal]
    image: str


async def handle_ddraft_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    ddraft_file: DDraftData = json.loads(data)

    image = base64.b64decode(ddraft_file["image"])

    sh = hashlib.sha1(image)
    hashname = sh.hexdigest()

    full_hash_path = get_asset_hash_subpath(hashname)

    if not (ASSETS_DIR / full_hash_path).exists():
        with open(ASSETS_DIR / full_hash_path, "wb") as f:
            f.write(image)

    template = {
        "version": "0",
        "shape": "assetrect",
        "templates": {
            "ddraft/uvtt": {
                "width": ddraft_file["resolution"]["map_size"]["x"] * 50,
                "height": ddraft_file["resolution"]["map_size"]["y"] * 50,
                "options": json.dumps(
                    [[f"ddraft_{k}", v] for k, v in ddraft_file.items() if k != "image"]
                ),
            }
        },
    }

    user = asset_state.get_user(sid)

    asset = Asset.create(
        name=upload_data.name,
        file_hash=hashname,
        owner=user,
        parent=upload_data.directory,
        options=json.dumps(template),
    )

    asset_dict = transform_asset(asset, user)
    await sio.emit(
        "Asset.Upload.Finish",
        {"asset": asset_dict, "parent": upload_data.directory},
        room=sid,
        namespace=ASSET_NS,
    )
    return asset_dict
