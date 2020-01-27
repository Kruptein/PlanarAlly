import functools
import hashlib

from aiohttp import web
from aiohttp_security import authorized_userid

import auth
from app import app, logger, sio, state
from models import Asset
from utils import FILE_DIR

ASSETS_DIR = FILE_DIR / "static" / "assets"
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir()


@sio.on("connect", namespace="/pa_assetmgmt")
async def assetmgmt_connect(sid, environ):
    user = await authorized_userid(environ["aiohttp.request"])
    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace="/pa_assetmgmt")
    else:
        state.add_sid(sid, user=user)
        root = Asset.get_root_folder(user)
        await sio.emit("Folder.Root.Set", root.id, room=sid, namespace="/pa_assetmgmt")


@sio.on("Folder.Get", namespace="/pa_assetmgmt")
async def get_folder(sid, folder=None):
    user = state.sid_map[sid]["user"]

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
        namespace="/pa_assetmgmt",
    )


@sio.on("Folder.GetByPath", namespace="/pa_assetmgmt")
async def get_folder_by_path(sid, folder):
    user = state.sid_map[sid]["user"]

    folder = folder.strip("/")
    target_folder = Asset.get_root_folder(user)

    idPath = []

    if folder:
        for path in folder.split("/"):
            target_folder = target_folder.get_child(path)
            idPath.append(target_folder.id)

    await sio.emit(
        "Folder.Set",
        {"folder": target_folder.as_dict(children=True), "path": idPath},
        room=sid,
        namespace="/pa_assetmgmt",
    )


@sio.on("Folder.Create", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def create_folder(sid, data):
    user = state.sid_map[sid]["user"]
    parent = data.get("parent", None)
    if parent is None:
        parent = Asset.get_root_folder(user)
    asset = Asset.create(name=data["name"], owner=user, parent=parent)
    await sio.emit(
        "Folder.Create", asset.as_dict(), room=sid, namespace="/pa_assetmgmt"
    )


@sio.on("Inode.Move", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def move_inode(sid, data):
    user = state.sid_map[sid]["user"]
    target = data.get("target", None)
    if target is None:
        target = Asset.get_root_folder(user)

    asset = Asset[data["inode"]]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to move files it doesn't own.")
        return
    asset.parent = target
    asset.save()


@sio.on("Asset.Rename", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_rename(sid, data):
    user = state.sid_map[sid]["user"]
    asset = Asset[data["asset"]]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to rename a file it doesn't own.")
        return
    asset.name = data["name"]
    asset.save()


@sio.on("Asset.Remove", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_rm(sid, data):
    user = state.sid_map[sid]["user"]
    asset = Asset[data]
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to remove a file it doesn't own.")
        return
    asset.delete_instance(recursive=True, delete_nullable=True)


@sio.on("Asset.Upload", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_upload(sid, file_data):
    uuid = file_data["uuid"]

    if uuid not in state.pending_file_upload_cache:
        state.pending_file_upload_cache[uuid] = {}
    state.pending_file_upload_cache[uuid][file_data["slice"]] = file_data
    if len(state.pending_file_upload_cache[uuid]) != file_data["totalSlices"]:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b""
    for slice_ in range(file_data["totalSlices"]):
        data += state.pending_file_upload_cache[uuid][slice_]["data"]

    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    if not (ASSETS_DIR / hashname).exists():
        with open(ASSETS_DIR / hashname, "wb") as f:
            f.write(data)

    del state.pending_file_upload_cache[uuid]

    sid_data = state.sid_map[sid]
    user = sid_data["user"]

    asset = Asset.create(
        name=file_data["name"],
        file_hash=hashname,
        owner=user,
        parent=file_data["directory"],
    )

    await sio.emit(
        "Asset.Upload.Finish", asset.as_dict(), room=sid, namespace="/pa_assetmgmt"
    )
