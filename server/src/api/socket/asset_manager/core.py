import hashlib
import io
import json
import os
import shutil
import tarfile
import tempfile
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Union
from uuid import uuid4

from aiohttp import web
from aiohttp_security import authorized_userid

from .... import auth
from ....app import app, sio
from ....db.models.asset import Asset
from ....db.models.user import User
from ....logs import logger
from ....state.asset import asset_state
from ....state.game import game_state
from ....utils import ASSETS_DIR, TEMP_DIR
from ...models.asset import (
    ApiAsset,
    ApiAssetFolder,
    ApiAssetInodeMove,
    ApiAssetRename,
    ApiAssetUpload,
    ApiAssetUploadFinish,
)
from ..constants import ASSET_NS, GAME_NS
from .ddraft import handle_ddraft_file
from .types import AssetDict, AssetExport


async def update_live_game(user: User):
    for sid, pr in game_state._sid_map.items():
        if pr.player == user:
            await sio.emit(
                "Asset.List.Set",
                Asset.get_user_structure(user),
                room=sid,
                namespace=GAME_NS,
            )


@sio.on("connect", namespace=ASSET_NS)
async def assetmgmt_connect(sid: str, environ):
    user = await authorized_userid(environ["aiohttp.request"])
    if user is None:
        await sio.emit("redirect", "/", room=sid, namespace=ASSET_NS)
    else:
        await asset_state.add_sid(sid, user)
        root = Asset.get_root_folder(user)
        await sio.emit("Folder.Root.Set", root.id, room=sid, namespace=ASSET_NS)


@sio.on("disconnect", namespace=ASSET_NS)
async def disconnect(sid):
    if not asset_state.has_sid(sid):
        return

    await asset_state.remove_sid(sid)


@sio.on("Folder.Get", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder(sid: str, folder: int | None = None):
    if folder is not None and folder < 0:
        return

    user = asset_state.get_user(sid)

    if folder is None:
        asset = Asset.get_root_folder(user)
    else:
        asset = Asset.get_by_id(folder)

    if asset.owner != user:
        raise web.HTTPForbidden()
    await sio.emit(
        "Folder.Set",
        ApiAssetFolder(folder=asset.as_pydantic(children=True), path=None),
        room=sid,
        namespace=ASSET_NS,
    )


@sio.on("Folder.GetByPath", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder_by_path(sid: str, folder: str):
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
        ApiAssetFolder(folder=target_folder.as_pydantic(children=True), path=None),
        room=sid,
        namespace=ASSET_NS,
    )


@sio.on("Folder.Create", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def create_folder(sid: str, data):
    user = asset_state.get_user(sid)
    parent = data.get("parent", None)
    if parent is None:
        parent = Asset.get_root_folder(user).id
    asset = Asset.create(name=data["name"], owner=user, parent=parent)
    await sio.emit(
        "Folder.Create",
        {"asset": asset.as_pydantic(), "parent": parent},
        room=sid,
        namespace=ASSET_NS,
    )
    await update_live_game(user)


@sio.on("Inode.Move", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def move_inode(sid: str, raw_data: Any):
    data = ApiAssetInodeMove(**raw_data)

    user = asset_state.get_user(sid)

    asset = Asset.get_by_id(data.inode)
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to move files it doesn't own.")
        return
    asset.parent_id = data.target
    asset.save()
    await update_live_game(user)


@sio.on("Asset.Rename", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rename(sid: str, raw_data: Any):
    data = ApiAssetRename(**raw_data)

    user = asset_state.get_user(sid)
    asset = Asset.get_by_id(data.asset)
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to rename a file it doesn't own.")
        return

    asset.name = data.name
    asset.save()
    await update_live_game(user)


@sio.on("Asset.Remove", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rm(sid: str, data: int):
    user = asset_state.get_user(sid)
    asset: Asset = Asset.get_by_id(data)
    if asset.owner != user:
        logger.warning(f"{user.name} attempted to remove a file it doesn't own.")
        return

    asset_dict = asset.as_pydantic(children=True, recursive=True)
    asset.delete_instance()

    await update_live_game(user)
    cleanup_assets([asset_dict])


def clean_filehash(file_hash: str):
    if (ASSETS_DIR / file_hash).exists():
        no_assets = Asset.get_or_none(file_hash=file_hash) is None
        if no_assets:
            logger.info(f"No asset maps to file {file_hash}, removing from server")
            (ASSETS_DIR / file_hash).unlink()


def cleanup_assets(assets: list[ApiAsset]):
    for asset in assets:
        if asset.fileHash:
            clean_filehash(asset.fileHash)

        if asset.children:
            cleanup_assets(asset.children)


def get_safe_members(members: List[tarfile.TarInfo]) -> List[tarfile.TarInfo]:
    safe_members: List[tarfile.TarInfo] = []
    for member in members:
        if member.islnk() or member.issym():
            continue
        if member.name.startswith("/") or ".." in member.name:
            continue
        # there is no real harm in extracting other files, but doesn't hurt to be a bit more strict
        if member.name != "data" and not member.name.startswith("files"):
            continue
        safe_members.append(member)
    return safe_members


async def handle_paa_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    with tempfile.TemporaryDirectory() as tmpdir:
        with tarfile.open(fileobj=io.BytesIO(data), mode="r:bz2") as tar:
            files = tarfile.TarInfo("files")
            files.type = tarfile.DIRTYPE
            # We need to explicitly list our members for security reasons
            # this is upload data so people could upload malicious stuff that breaks out of the path etc
            tar.extractall(path=tmpdir, members=get_safe_members(tar.getmembers()))

        tmp_path = Path(tmpdir)
        for asset in os.listdir(tmp_path / "files"):
            if not (ASSETS_DIR / asset).exists():
                shutil.move(str(tmp_path / "files" / asset), str(ASSETS_DIR / asset))

        with open(tmp_path / "data") as json_data:
            raw_assets: list[AssetDict] = json.load(json_data)

    user = asset_state.get_user(sid)
    parent_map: Dict[int, int] = defaultdict(lambda: upload_data.directory)

    for raw_asset in raw_assets:
        new_asset = Asset.create(
            name=raw_asset["name"],
            file_hash=raw_asset["file_hash"],
            owner=user,
            parent=parent_map[raw_asset["parent"]],
            options=raw_asset["options"],
        )
        parent_map[raw_asset["id"]] = new_asset.id

    await sio.emit(
        "Asset.Import.Finish", upload_data.name, room=sid, namespace=ASSET_NS
    )


async def handle_regular_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    if not (ASSETS_DIR / hashname).exists():
        with open(ASSETS_DIR / hashname, "wb") as f:
            f.write(data)

    user = asset_state.get_user(sid)

    target = upload_data.directory

    for directory in upload_data.newDirectories:
        asset, created = Asset.get_or_create(name=directory, owner=user, parent=target)
        if created:
            await sio.emit(
                "Folder.Create",
                {"asset": asset.as_pydantic(), "parent": target},
                room=sid,
                namespace=ASSET_NS,
            )
        target = asset.id

    asset = Asset.create(
        name=upload_data.name,
        file_hash=hashname,
        owner=user,
        parent=target,
    )

    asset_dict = asset.as_pydantic()
    await sio.emit(
        "Asset.Upload.Finish",
        ApiAssetUploadFinish(asset=asset_dict, parent=target),
        room=sid,
        namespace=ASSET_NS,
    )
    return asset_dict


@sio.on("Asset.Upload", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_upload(sid: str, raw_data: Any):
    upload_data = ApiAssetUpload(**raw_data)

    uuid = upload_data.uuid

    if uuid not in asset_state.pending_file_upload_cache:
        asset_state.pending_file_upload_cache[uuid] = {}
    asset_state.pending_file_upload_cache[uuid][upload_data.slice] = upload_data
    if len(asset_state.pending_file_upload_cache[uuid]) != upload_data.totalSlices:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b""
    for slice_ in range(upload_data.totalSlices):
        data += asset_state.pending_file_upload_cache[uuid][slice_].data

    del asset_state.pending_file_upload_cache[upload_data.uuid]

    return_data = None
    file_name = upload_data.name
    if file_name.endswith(".paa"):
        await handle_paa_file(upload_data, data, sid)
    elif file_name.endswith(".dd2vtt"):
        return_data = await handle_ddraft_file(upload_data, data, sid)
    else:
        return_data = await handle_regular_file(upload_data, data, sid)

    user = asset_state.get_user(sid)
    await update_live_game(user)

    return return_data


def export_asset(asset: Union[ApiAsset, List[ApiAsset]], parent=-1) -> AssetExport:
    file_hashes: List[str] = []
    asset_info: List[ApiAsset] = []

    if not isinstance(asset, list):
        asset_dict = asset.copy(exclude={"children"})
        asset_info.append(asset_dict)
        if asset.fileHash is not None:
            file_hashes.append(asset.fileHash)

        children = asset.children or []
        parent = asset.id
    else:
        children = asset

    for child in children:
        child_data = export_asset(child, parent)
        file_hashes.extend(child_data["file_hashes"])
        asset_info.extend(child_data["data"])
    return {"file_hashes": file_hashes, "data": asset_info}


@sio.on("Asset.Export", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_export(sid: str, selection: List[int]):
    full_selection = [
        Asset.get_by_id(asset).as_pydantic(True, True) for asset in selection
    ]

    asset_data = export_asset(full_selection)
    json_data = json.dumps(asset_data["data"])

    data_tar_info = tarfile.TarInfo(
        "data",
    )
    data_tar_info.size = len(json_data)
    data_tar_info.mode = 0o755
    data_tar_info.mtime = time.time()  # type: ignore

    files_tar_info = tarfile.TarInfo("files")
    files_tar_info.type = tarfile.DIRTYPE
    files_tar_info.mode = 0o755
    files_tar_info.mtime = time.time()  # type: ignore

    uuid = uuid4()
    os.makedirs(TEMP_DIR, exist_ok=True)
    with tarfile.open(TEMP_DIR / f"{uuid}.paa", "w:bz2") as tar:
        tar.addfile(data_tar_info, io.BytesIO(json_data.encode("utf-8")))
        tar.addfile(files_tar_info)
        for file_hash in asset_data["file_hashes"]:
            try:
                file_path = ASSETS_DIR / file_hash
                info = tar.gettarinfo(str(file_path))
                info.name = f"files/{file_hash}"
                info.mtime = time.time()  # type: ignore
                info.mode = 0o755
                tar.addfile(info, open(file_path, "rb"))  # type: ignore
            except FileNotFoundError:
                pass

    await sio.emit("Asset.Export.Finish", str(uuid), room=sid, namespace=ASSET_NS)
