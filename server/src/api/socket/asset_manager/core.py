import hashlib
import tarfile
from typing import Any, List

from aiohttp import web

from .... import auth
from ....app import app, sio
from ....config import config
from ....db.models.asset import Asset
from ....db.models.asset_rect import AssetRect
from ....db.models.user import User
from ....logs import logger
from ....state.asset import asset_state
from ....transform.to_api.asset import transform_asset
from ....utils import ASSETS_DIR, get_asset_hash_subpath
from ...models.asset import (
    ApiAsset,
    ApiAssetAdd,
    ApiAssetCreateFolder,
    ApiAssetFolder,
    ApiAssetInodeMove,
    ApiAssetRename,
    ApiAssetUpload,
)
from ..constants import ASSET_NS
from .ddraft import handle_ddraft_file


# todo: This used to send the entire asset list to the client,
# we should now only send the relevant update
async def update_live_game(user: User):
    pass


@sio.on("connect", namespace=ASSET_NS)
async def assetmgmt_connect(sid: str, environ):
    user = await auth.get_authorized_user(environ["aiohttp.request"])
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


def _get_folder(asset: Asset, user: User, sid: str, *, path: list[int] | None):
    if asset.can_be_accessed_by(user, right="all"):
        shared_parent = None
        if sp := asset.get_shared_parent(user):
            shared_parent = transform_asset(sp.asset, user)

        return (
            ApiAssetFolder(
                folder=transform_asset(asset, user, children=True),
                sharedParent=shared_parent,
                sharedRight=None if sp is None else sp.right,
                path=path,
            ),
        )
    else:
        raise web.HTTPForbidden()


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

    return _get_folder(asset, user, sid, path=None)


@sio.on("Folder.GetByPath", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder_by_path(sid: str, folder: str):
    user = asset_state.get_user(sid)

    folder = folder.strip("/")
    root_folder = Asset.get_root_folder(user)
    target_folder = root_folder

    id_path: list[int] = []

    if folder:
        for path in folder.split("/"):
            if target_folder := target_folder.get_child(path):
                id_path.append(target_folder.id)
            else:
                target_folder = root_folder
                break

    return _get_folder(target_folder, user, sid, path=id_path)


@sio.on("Folder.Create", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def create_folder(sid: str, raw_data: Any):
    data = ApiAssetCreateFolder(**raw_data)

    user = asset_state.get_user(sid)

    asset = Asset.get_by_id(data.parent)
    if not asset.can_be_accessed_by(user, right="edit"):
        logger.warn(f"{user.name} attempted to create a folder without permissions")
        return

    asset = Asset.create(name=data.name, owner=user, parent=data.parent)
    await sio.emit(
        "Asset.Add",
        ApiAssetAdd(asset=transform_asset(asset, user), parent=data.parent),
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
    target = Asset.get_by_id(data.target)

    # The user NEEDS edit access in the target folder
    if not target.can_be_accessed_by(user, right="edit"):
        logger.warn(
            f"{user.name} attempted to move an asset into a folder they don't own"
        )
        return

    if asset.owner == user:
        asset.parent_id = data.target
        asset.save()
    else:
        # Check if we're moving the anchor itself
        for share in asset.shares:
            if share.user == user:
                share.parent_id = data.target
                share.save()
                break
        else:
            # todo: What to do if files move to a folder with a different owner
            # Check if we have edit rights in the shared folder
            if asset.can_be_accessed_by(user, right="edit"):
                asset.parent_id = data.target
                asset.save()
            else:
                logger.warning(f"{user.name} attempted to move files they don't own.")
                return

    await update_live_game(user)


@sio.on("Asset.Rename", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rename(sid: str, raw_data: Any):
    data = ApiAssetRename(**raw_data)

    user = asset_state.get_user(sid)
    asset = Asset.get_by_id(data.asset)

    if not asset.can_be_accessed_by(user, right="edit"):
        logger.warning(f"{user.name} attempted to rename a file they don't own.")
        return

    asset.name = data.name
    asset.save()
    await update_live_game(user)


@sio.on("Asset.Remove", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rm(sid: str, data: int):
    user = asset_state.get_user(sid)
    asset: Asset = Asset.get_by_id(data)

    remove_asset = False

    if asset.owner == user:
        remove_asset = True
    else:
        # Check if we're removing the anchor itself
        for share in asset.shares:
            if share.user == user:
                share.delete_instance(True)
                break
        else:
            # Check if we have edit rights in the shared folder
            if asset.can_be_accessed_by(user, right="edit"):
                remove_asset = True
            else:
                logger.warning(
                    f"{user.name} attempted to remove a file they don't own."
                )
                return

    if remove_asset:
        asset_model = transform_asset(asset, user, children=True, recursive=True)
        asset.delete_instance()
        cleanup_assets([asset_model])

    await update_live_game(user)


def clean_filehash(file_hash: str):
    full_hash_path = get_asset_hash_subpath(file_hash)
    if (ASSETS_DIR / full_hash_path).exists():
        no_assets = Asset.get_or_none(file_hash=file_hash) is None
        no_shapes = AssetRect.get_or_none(src=full_hash_path) is None
        if no_assets and no_shapes:
            logger.info(f"No asset maps to file {file_hash}, removing from server")
            (ASSETS_DIR / full_hash_path).unlink()


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


async def handle_regular_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    full_hash_path = ASSETS_DIR / get_asset_hash_subpath(hashname)

    if not full_hash_path.exists():
        full_hash_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_hash_path, "wb") as f:
            f.write(data)

    user = asset_state.get_user(sid)

    target = upload_data.directory

    for directory in upload_data.newDirectories:
        asset, created = Asset.get_or_create(name=directory, owner=user, parent=target)
        if created:
            await sio.emit(
                "Asset.Add",
                ApiAssetAdd(asset=transform_asset(asset, user), parent=target),
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

    asset.generate_thumbnails()

    asset_dict = transform_asset(asset, user)
    await sio.emit(
        "Asset.Upload.Finish",
        ApiAssetAdd(asset=asset_dict, parent=target),
        room=sid,
        namespace=ASSET_NS,
    )
    return asset_dict


@sio.on("Asset.Upload.Limit", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_upload_limit(sid: str):
    user = asset_state.get_user(sid)
    return {
        "single": config.getint("Webserver", "max_single_asset_size_in_bytes"),
        "used": user.get_total_asset_size(),
        "total": config.getint("Webserver", "max_total_asset_size_in_bytes"),
    }


@sio.on("Asset.Upload", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_upload(sid: str, raw_data: Any):
    upload_data = ApiAssetUpload(**raw_data)

    user = asset_state.get_user(sid)

    if asset := Asset.get_or_none(id=upload_data.directory):
        if not asset.can_be_accessed_by(user, right="edit"):
            logger.warn(f"{user.name} attempted to upload into a folder they don't own")
            return

    uuid = upload_data.uuid

    if uuid not in asset_state.pending_file_upload_cache:
        asset_state.pending_file_upload_cache[uuid] = {}
    asset_state.pending_file_upload_cache[uuid][upload_data.slice] = upload_data
    # todo: verify that `totalSlices` does not change between messages
    if len(asset_state.pending_file_upload_cache[uuid]) != upload_data.totalSlices:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b""
    for slice_ in range(upload_data.totalSlices):
        data += asset_state.pending_file_upload_cache[uuid][slice_].data

    del asset_state.pending_file_upload_cache[upload_data.uuid]

    total_asset_size = user.get_total_asset_size()
    max_single_asset_size = config.getint("Webserver", "max_single_asset_size_in_bytes")
    max_total_asset_size = config.getint("Webserver", "max_total_asset_size_in_bytes")

    if max_single_asset_size > 0 and len(data) > max_single_asset_size:
        logger.warn(
            f"{user.name} attempted to upload a file that is too large ({len(data)} > {max_single_asset_size})"
        )
        return
    if max_total_asset_size > 0 and total_asset_size + len(data) > max_total_asset_size:
        logger.warn(
            f"{user.name} attempted to upload a file that is too large ({total_asset_size + len(data)} > {max_total_asset_size})"
        )
        return

    return_data = None
    file_name = upload_data.name
    if file_name.endswith(".dd2vtt"):
        return_data = await handle_ddraft_file(upload_data, data, sid)
    else:
        return_data = await handle_regular_file(upload_data, data, sid)

    await update_live_game(user)

    return return_data


@sio.on("Asset.Search", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_search(sid: str, query: str):
    user = asset_state.get_user(sid)

    assets = Asset.select().where(Asset.owner == user & Asset.name.contains(query)).order_by(Asset.name)  # type: ignore

    return [transform_asset(asset, user) for asset in assets]


@sio.on("Asset.FolderPath", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder_path(sid: str, asset_id: int):
    user = asset_state.get_user(sid)

    asset = Asset.get_by_id(asset_id)
    if not asset.can_be_accessed_by(user, right="view"):
        return []

    path = []
    while asset is not None:
        path.insert(0, {"id": asset.id, "name": asset.name})
        asset = asset.parent

    return path
