import hashlib
from typing import Any

from aiohttp import web

from .... import auth
from ....app import app, sio
from ....config import cfg
from ....db.models.asset import Asset
from ....db.models.asset_entry import AssetEntry
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
        root = AssetEntry.get_root_folder(user)
        await sio.emit("Folder.Root.Set", root.id, room=sid, namespace=ASSET_NS)


@sio.on("disconnect", namespace=ASSET_NS)
async def disconnect(sid):
    if not asset_state.has_sid(sid):
        return

    await asset_state.remove_sid(sid)


def _get_folder(entry: AssetEntry, user: User, *, path: list[int] | None):
    if entry.can_be_accessed_by(user, right="all"):
        shared_parent = None
        if sp := entry.get_shared_parent(user):
            shared_parent = transform_asset(sp.entry, user)

        return (
            ApiAssetFolder(
                folder=transform_asset(entry, user, children=True),
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
        entry = AssetEntry.get_root_folder(user)
    else:
        entry = AssetEntry.get_by_id(folder)

    return _get_folder(entry, user, path=None)


@sio.on("Folder.GetByPath", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder_by_path(sid: str, folder: str):
    user = asset_state.get_user(sid)

    folder = folder.strip("/")
    root_folder = AssetEntry.get_root_folder(user)
    target_folder = root_folder

    id_path: list[int] = []

    if folder:
        for path in folder.split("/"):
            if target_folder := target_folder.get_child(path):
                id_path.append(target_folder.id)
            else:
                target_folder = root_folder
                break

    return _get_folder(target_folder, user, path=id_path)


@sio.on("Folder.Create", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def create_folder(sid: str, raw_data: Any):
    data = ApiAssetCreateFolder(**raw_data)

    user = asset_state.get_user(sid)

    entry = AssetEntry.get_by_id(data.parent)
    if not entry.can_be_accessed_by(user, right="edit"):
        logger.warning(f"{user.name} attempted to create a folder without permissions")
        return

    entry = AssetEntry.create(name=data.name, owner=user, parent=data.parent)
    await sio.emit(
        "Asset.Add",
        ApiAssetAdd(asset=transform_asset(entry, user), parent=data.parent),
        room=sid,
        namespace=ASSET_NS,
    )
    await update_live_game(user)


@sio.on("Inode.Move", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def move_inode(sid: str, raw_data: Any):
    data = ApiAssetInodeMove(**raw_data)

    user = asset_state.get_user(sid)

    asset_entry = AssetEntry.get_by_id(data.inode)
    target_entry = AssetEntry.get_by_id(data.target)

    # The user NEEDS edit access in the target folder
    if not target_entry.can_be_accessed_by(user, right="edit"):
        logger.warning(f"{user.name} attempted to move an asset into a folder they don't own")
        return

    if asset_entry.owner == user:
        asset_entry.parent_id = data.target
        asset_entry.save()
    else:
        # Check if we're moving the anchor itself
        for share in asset_entry.shares:
            if share.user == user:
                share.parent_id = data.target
                share.save()
                break
        else:
            # todo: What to do if files move to a folder with a different owner
            # Check if we have edit rights in the shared folder
            if asset_entry.can_be_accessed_by(user, right="edit"):
                asset_entry.parent_id = data.target
                asset_entry.save()
            else:
                logger.warning(f"{user.name} attempted to move files they don't own.")
                return

    await update_live_game(user)


@sio.on("Asset.Rename", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rename(sid: str, raw_data: Any):
    data = ApiAssetRename(**raw_data)

    user = asset_state.get_user(sid)
    entry = AssetEntry.get_by_id(data.asset)

    if not entry.can_be_accessed_by(user, right="edit"):
        logger.warning(f"{user.name} attempted to rename a file they don't own.")
        return

    entry.name = data.name
    entry.save()
    await update_live_game(user)


@sio.on("Asset.Remove", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_rm(sid: str, data: int):
    user = asset_state.get_user(sid)
    entry = AssetEntry.get_by_id(data)

    remove_asset = False

    if entry.owner == user:
        remove_asset = True
    else:
        # Check if we're removing the anchor itself
        for share in entry.shares:
            if share.user == user:
                share.delete_instance(True)
                break
        else:
            # Check if we have edit rights in the shared folder
            if entry.can_be_accessed_by(user, right="edit"):
                remove_asset = True
            else:
                logger.warning(f"{user.name} attempted to remove a file they don't own.")
                return

    if remove_asset:
        asset_model = transform_asset(entry, user, children=True, recursive=True)
        entry.delete_instance()
        cleanup_assets([asset_model])

    await update_live_game(user)


def cleanup_assets(entries: list[ApiAsset]):
    for entry in entries:
        if entry.assetId:
            asset = Asset.get_by_id(entry.assetId)
            asset.cleanup_check()

        if entry.children:
            cleanup_assets(entry.children)


async def handle_regular_file(upload_data: ApiAssetUpload, data: bytes, sid: str):
    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    full_hash_path = ASSETS_DIR / get_asset_hash_subpath(hashname)

    if not full_hash_path.exists():
        full_hash_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_hash_path, "wb") as f:
            f.write(data)

    user = asset_state.get_user(sid)

    asset, created = Asset.get_or_create(owner=user, file_hash=hashname)
    if created:
        asset.generate_thumbnails()

    target = upload_data.directory

    for directory in upload_data.newDirectories:
        entry, created = AssetEntry.get_or_create(name=directory, owner=user, parent=target)
        if created:
            await sio.emit(
                "Asset.Add",
                ApiAssetAdd(asset=transform_asset(entry, user), parent=target),
                room=sid,
                namespace=ASSET_NS,
            )
        target = entry.id

    # TODO: share some of this logic with the ddraft handler using a helper function

    entry = AssetEntry.create(
        name=upload_data.name,  # TODO: strip extension
        asset=asset,
        owner=user,
        parent=target,
    )

    asset_dict = transform_asset(entry, user)
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
    config = cfg()
    return {
        "single": config.assets.max_single_asset_size_in_bytes,
        "used": user.get_total_asset_size(),
        "total": config.assets.max_total_asset_size_in_bytes,
    }


@sio.on("Asset.Upload", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def assetmgmt_upload(sid: str, raw_data: Any):
    upload_data = ApiAssetUpload(**raw_data)

    user = asset_state.get_user(sid)

    if entry := AssetEntry.get_or_none(id=upload_data.directory):
        if not entry.can_be_accessed_by(user, right="edit"):
            logger.warning(f"{user.name} attempted to upload into a folder they don't own")
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

    config = cfg()

    total_asset_size = user.get_total_asset_size()
    max_single_asset_size = config.assets.max_single_asset_size_in_bytes
    max_total_asset_size = config.assets.max_total_asset_size_in_bytes

    if max_single_asset_size > 0 and len(data) > max_single_asset_size:
        logger.warning(
            f"{user.name} attempted to upload a file that is too large ({len(data)} > {max_single_asset_size})"
        )
        return
    if max_total_asset_size > 0 and total_asset_size + len(data) > max_total_asset_size:
        logger.warning(
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
async def assetmgmt_search(sid: str, query: str, include_shared_assets: bool):
    user = asset_state.get_user(sid)

    # Expensive path
    if include_shared_assets:
        entries = []
        for entry in AssetEntry.get_all_assets(user):
            if query in entry.name.lower():
                entries.append(entry)
    else:
        entries = (
            AssetEntry.select()
            .where((AssetEntry.owner == user) & AssetEntry.name.contains(query))  # type: ignore
            .order_by(AssetEntry.name)
        )

    return [transform_asset(entry, user) for entry in entries]


@sio.on("Asset.FolderPath", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_folder_path(sid: str, asset_id: int):
    user = asset_state.get_user(sid)

    entry = AssetEntry.get_by_id(asset_id)
    if not entry.can_be_accessed_by(user, right="view"):
        return []

    path = []
    while entry is not None:
        path.insert(0, {"id": entry.id, "name": entry.name})
        entry = entry.parent

    return path
