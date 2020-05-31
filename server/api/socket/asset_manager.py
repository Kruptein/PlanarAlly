import functools
import hashlib

from aiohttp import web
from aiohttp_security import authorized_userid

import auth
from app import app, logger, sio
from .constants import ASSET_NS
from models import Asset
from state.asset import asset_state
from utils import FILE_DIR

ASSETS_DIR = FILE_DIR / "static" / "assets"
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir()


@sio.on("connect", namespace=ASSET_NS)
async def assetmgmt_connect(sid: int, environ):
    user = await authorized_userid(environ["aiohttp.request"])
    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace=ASSET_NS)
    else:
        await asset_state.add_sid(sid, user)
        root = Asset.get_root_folder(user)
        await sio.emit("Folder.Root.Set", root.id, room=sid, namespace=ASSET_NS)


@sio.on("Folder.Get", namespace=ASSET_NS)
async def get_folder(sid: int, folder=None):
    user = asset_state.get_user(sid)

    if folder is None:
        folder = Asset.get_root_folder(user)
    else:
        folder = Asset[folder]

    if folder.owner != user:
        raise web.HTTPForbidden
    await sio.emit(
        "Folder.Set",
        {"folder": folder.as_dict(children=True)},
        room=sid,
        namespace=ASSET_NS,
    )


@sio.on("Folder.GetByPath", namespace=ASSET_NS)
async def get_folder_by_path(sid: int, folder):
    user = asset_state.get_user(sid)

    folder = folder.strip("/")
    target_folder = Asset.get_root_folder(user)

    id_path = []

    if folder:
        for path in folder.split("/"):
            try:
                target_folder = target_folder.get_child(path)
                id_path.append(target_folder.id)
            except Asset.DoesNotExist:
                return await get_folder_by_path(sid, "/")

    await sio.emit(
        "Folder.Set",
        {"folder": target_folder.as_dict(children=True), "path": id_path},
        room=sid,
        namespace=ASSET_NS,
    )


@sio.on("Folder.Create", namespace=ASSET_NS)
@auth.login_required(app, sio)
async def create_folder(sid: int, data):
    user = asset_state.get_user(sid)
    parent = data.get("parent", None)
    if parent is None:
        parent = Asset.get_root_folder(user)
    asset = Asset.create(name=data["name"], owner=user, parent=parent)
    await sio.emit("Folder.Create", asset.as_dict(), room=sid, namespace=ASSET_NS)


@sio.on("Inode.Move", namespace=ASSET_NS)
@auth.login_required(app, sio)
async def move_inode(sid: int, data):
    user = asset_state.get_user(sid)
    target = data.get("target", None)
    if target is None:
        target = Asset.get_root_folder(user)

    asset = Asset[data["inode"]]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to move files it doesn't own.")
        return
    asset.parent = target
    asset.save()


@sio.on("Asset.Rename", namespace=ASSET_NS)
@auth.login_required(app, sio)
async def assetmgmt_rename(sid: int, data):
    user = asset_state.get_user(sid)
    asset = Asset[data["asset"]]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to rename a file it doesn't own.")
        return
    asset.name = data["name"]
    asset.save()


@sio.on("Asset.Remove", namespace=ASSET_NS)
@auth.login_required(app, sio)
async def assetmgmt_rm(sid: int, data):
    user = asset_state.get_user(sid)
    asset = Asset[data]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to remove a file it doesn't own.")
        return
    asset.delete_instance(recursive=True, delete_nullable=True)

    if asset.file_hash is not None and (ASSETS_DIR / asset.file_hash).exists():
        if Asset.select().where(Asset.file_hash == asset.file_hash).count() == 0:
            logger.info(
                f"No asset maps to file {asset.file_hash}, removing from server"
            )
            (ASSETS_DIR / asset.file_hash).unlink()


@sio.on("Asset.Upload", namespace=ASSET_NS)
@auth.login_required(app, sio)
async def assetmgmt_upload(sid: int, file_data):
    uuid = file_data["uuid"]

    if uuid not in asset_state.pending_file_upload_cache:
        asset_state.pending_file_upload_cache[uuid] = {}
    asset_state.pending_file_upload_cache[uuid][file_data["slice"]] = file_data
    if len(asset_state.pending_file_upload_cache[uuid]) != file_data["totalSlices"]:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b""
    for slice_ in range(file_data["totalSlices"]):
        data += asset_state.pending_file_upload_cache[uuid][slice_]["data"]

    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    if not (ASSETS_DIR / hashname).exists():
        with open(ASSETS_DIR / hashname, "wb") as f:
            f.write(data)

    del asset_state.pending_file_upload_cache[uuid]

    user = asset_state.get_user(sid)

    asset = Asset.create(
        name=file_data["name"],
        file_hash=hashname,
        owner=user,
        parent=file_data["directory"],
    )

    await sio.emit("Asset.Upload.Finish", asset.as_dict(), room=sid, namespace=ASSET_NS)
