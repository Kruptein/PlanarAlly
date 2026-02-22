import base64
import hashlib
import json

from typing_extensions import TypedDict

from ....app import sio
from ....db.models.asset import Asset
from ....db.models.asset_entry import AssetEntry
from ....state.asset import asset_state
from ....transform.to_api.asset import transform_asset
from ....utils import ASSETS_DIR, get_asset_hash_subpath
from ...models.asset import ApiAssetAdd, ApiAssetUpload
from ..constants import ASSET_NS


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


async def handle_ddraft_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    ddraft_file: DDraftData = json.loads(data)

    image = base64.b64decode(ddraft_file["image"])

    sh = hashlib.sha1(image)
    hashname = sh.hexdigest()

    full_path = ASSETS_DIR / get_asset_hash_subpath(hashname)

    if not full_path.exists():
        full_path.parent.mkdir(exist_ok=True, parents=True)
        with open(full_path, "wb") as f:
            f.write(image)

    # template = {
    #     "version": "0",
    #     "shape": "assetrect",
    #     "templates": {
    #         "ddraft/uvtt": {
    #             "width": ddraft_file["resolution"]["map_size"]["x"] * 50,
    #             "height": ddraft_file["resolution"]["map_size"]["y"] * 50,
    #             "options": json.dumps([[f"ddraft_{k}", v] for k, v in ddraft_file.items() if k != "image"]),
    #         }
    #     },
    # }

    user = asset_state.get_user(sid)

    asset, created = Asset.get_or_create(owner=user, file_hash=hashname)
    if created:
        # todo: fix ddraft integration
        # asset.templates.add(ShapeTemplate.create(asset=asset, name="ddraft/uvtt", options=json.dumps(template)))
        pass

    entry = AssetEntry.create(
        name=upload_data.name,
        asset=asset,
        owner=user,
        parent=upload_data.directory,
    )

    asset_dict = transform_asset(entry, user)
    await sio.emit(
        "Asset.Upload.Finish",
        ApiAssetAdd(asset=asset_dict, parent=upload_data.directory),
        room=sid,
        namespace=ASSET_NS,
    )
    return asset_dict
