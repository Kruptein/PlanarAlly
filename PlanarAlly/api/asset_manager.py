import functools
import hashlib

from aiohttp_security import authorized_userid

import auth
from app import app, logger, sio, state, FILE_DIR

ASSETS_DIR = FILE_DIR / "static" / "assets"
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir()


@sio.on("connect", namespace="/pa_assetmgmt")
async def assetmgmt_connect(sid, environ):
    username = await authorized_userid(environ["aiohttp.request"])
    if username is None:
        await sio.emit("redirect", "/", room=sid, namespace="/pa_assetmgmt")
    else:
        app["AuthzPolicy"].sid_map[sid] = {
            "user": app["AuthzPolicy"].user_map[username]
        }
        await sio.emit(
            "assetInfo",
            app["AuthzPolicy"].user_map[username].asset_info,
            room=sid,
            namespace="/pa_assetmgmt",
        )


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

    policy = app["AuthzPolicy"]
    user = policy.sid_map[sid]["user"]
    folder = functools.reduce(dict.get, file_data["directory"], user.asset_info)
    if folder is None:
        logger.warning(
            f"Directory structure {file_data['directory']} is not valid for {user.name}"
        )
        return

    file_info = {"name": file_data["name"], "hash": hashname}
    if "__files" not in folder:
        folder["__files"] = []
    folder["__files"].append(file_info)

    policy.save()

    await sio.emit(
        "Asset.Upload.Finish",
        {"fileInfo": file_info, "directory": file_data["directory"]},
        room=sid,
        namespace="/pa_assetmgmt",
    )


@sio.on("Asset.Directory.New", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_mkdir(sid, data):
    policy = app["AuthzPolicy"]
    user = policy.sid_map[sid]["user"]
    folder = functools.reduce(dict.get, data["directory"], user.asset_info)
    folder[data["name"]] = {"__files": []}
    policy.save()


@sio.on("Asset.Rename", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_rename(sid, data):
    policy = app["AuthzPolicy"]
    user = policy.sid_map[sid]["user"]
    folder = functools.reduce(dict.get, data["directory"], user.asset_info)
    if data["isFolder"]:
        folder[data["newName"]] = folder[data["oldName"]]
        del folder[data["oldName"]]
    else:
        for fl in folder["__files"]:
            if fl["name"] == data["oldName"]:
                fl["name"] = data["newName"]
    policy.save()


@sio.on("Inode.Move", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_mv(sid, data):
    policy = app["AuthzPolicy"]
    user = policy.sid_map[sid]["user"]
    folder = functools.reduce(dict.get, data["directory"], user.asset_info)
    if data["target"] == "..":
        target_directory = data["directory"][:-1]
    else:
        target_directory = data["directory"] + [data["target"]]
    target_folder = functools.reduce(dict.get, target_directory, user.asset_info)
    name = data["inode"] if data["isFolder"] else data["inode"]["name"]
    if data["isFolder"]:
        target_folder[name] = folder[name]
        del folder[name]
    else:
        if not target_folder["__files"]:
            target_folder["__files"] = []
        target_folder["__files"].append(data["inode"])
        folder["__files"] = [
            fl for fl in folder["__files"] if fl["hash"] != data["inode"]["hash"]
        ]
    policy.save()


@sio.on("Asset.Remove", namespace="/pa_assetmgmt")
@auth.login_required(app, sio)
async def assetmgmt_rm(sid, data):
    policy = app["AuthzPolicy"]
    user = policy.sid_map[sid]["user"]
    folder = functools.reduce(dict.get, data["directory"], user.asset_info)
    if data["isFolder"] and data["name"] in folder:
        del folder[data["name"]]
    else:
        index = next(
            (i for i, fl in enumerate(folder["__files"]) if fl["name"] == data["name"]),
            None,
        )
        if index is not None:
            folder["__files"].pop(index)
    policy.save()
