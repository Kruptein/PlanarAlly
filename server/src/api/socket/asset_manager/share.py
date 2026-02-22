from typing import Any

from .... import auth
from ....app import app, sio
from ....db.models.asset_entry import AssetEntry
from ....db.models.asset_share import AssetShare
from ....db.models.user import User
from ....logs import logger
from ....state.asset import asset_state
from ....transform.to_api.asset import transform_asset
from ...helpers import send_log_toast
from ...models.asset import ApiAssetAdd
from ...models.asset.share import ApiAssetCreateShare, ApiAssetRemoveShare
from ..constants import ASSET_NS


@sio.on("Asset.Share.Create", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def share_asset(sid: str, raw_data: Any):
    initiating_user = asset_state.get_user(sid)

    data = ApiAssetCreateShare(**raw_data)

    target_user = User.by_name(data.user)
    if target_user is None:
        await send_log_toast("Username does not exist", "warn", room=sid, namespace=ASSET_NS)
        return
    elif target_user == initiating_user:
        await send_log_toast(
            "Sharing with yourself is not valid",
            "warn",
            room=sid,
            namespace=ASSET_NS,
        )
        return

    try:
        entry = AssetEntry.get_by_id(data.asset)
    except AssetEntry.DoesNotExist:
        await send_log_toast("Asset does not exist", "warn", room=sid, namespace=ASSET_NS)
        return

    if entry.owner != initiating_user:
        await send_log_toast("You do not own this asset", "warn", room=sid, namespace=ASSET_NS)
        return

    try:
        asset_share = AssetShare.create(
            entry=entry,
            user=target_user,
            right=data.right,
            name=f"{initiating_user.name}-{entry.name}",
            parent=AssetEntry.get_root_folder(target_user),
        )
    except:
        await send_log_toast("Failed to create asset share", "warn", room=sid, namespace=ASSET_NS)
        return

    for user in [entry.owner, *(s.user for s in entry.shares if s.user != target_user)]:
        for psid in asset_state.get_sids(name=user.name):
            await sio.emit("Asset.Share.Created", data, room=psid, namespace=ASSET_NS)

    for psid in asset_state.get_sids(name=target_user.name):
        await sio.emit(
            "Asset.Add",
            ApiAssetAdd(
                asset=transform_asset(entry, user=target_user),
                parent=asset_share.parent_id,
            ),
            room=psid,
            namespace=ASSET_NS,
        )


@sio.on("Asset.Share.Edit", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def edit_asset_share(sid: str, raw_data: Any):
    initiating_user = asset_state.get_user(sid)

    data = ApiAssetCreateShare(**raw_data)

    if entry := AssetEntry.get_or_none(id=data.asset):
        users_with_edit_access: list[User] = [entry.owner]
        shares = list(entry.shares)  # we're going to iterate twice

        for share in shares:
            if share.right == "edit":
                users_with_edit_access.append(share.user)

        if initiating_user not in users_with_edit_access:
            logger.warning(f"{initiating_user.name} attempted to edit asset share rights without permissions.")
            return

        for share in shares:
            if share.user.name == data.user:
                share.right = data.right
                share.save()

                users_to_message = set(users_with_edit_access)
                if u := User.by_name(data.user):
                    users_to_message.add(u)

                for user in users_to_message:
                    for psid in asset_state.get_sids(name=user.name):
                        await sio.emit("Asset.Share.Edit", data, room=psid, namespace=ASSET_NS)
                break
        else:
            logger.warning("Attempt to edit non-existing asset share.")
            return
    else:
        logger.warning("Attempt to edit asset share from unknown shape.")
        return


@sio.on("Asset.Share.Remove", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def remove_asset_share(sid: str, raw_data: Any):
    initiating_user = asset_state.get_user(sid)

    data = ApiAssetRemoveShare(**raw_data)

    if entry := AssetEntry.get_or_none(id=data.asset):
        users_with_edit_access: list[User] = [entry.owner]
        shares = list(entry.shares)  # we're going to iterate twice

        for share in shares:
            if share.right == "edit":
                users_with_edit_access.append(share.user)

        if initiating_user not in users_with_edit_access:
            logger.warning(f"{initiating_user.name} attempted to remove asset share rights without permissions.")
            return

        for share in shares:
            if share.user.name == data.user:
                share.delete_instance(True)

                users_to_message = [*users_with_edit_access]
                if u := User.by_name(data.user):
                    users_to_message.append(u)

                for user in users_to_message:
                    for psid in asset_state.get_sids(name=user.name):
                        await sio.emit("Asset.Share.Removed", data, room=psid, namespace=ASSET_NS)
                break
        else:
            logger.warning("Attempt to remove non-existing asset share.")
            return
    else:
        logger.warning("Attempt to remove asset share from unknown shape.")
        return


@sio.on("Connections.Usernames.Get", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def get_usernames(sid: str):
    user = asset_state.get_user(sid)

    usernames = set()

    rooms = [*user.rooms_created]
    for pr in user.rooms_joined:
        rooms.append(pr.room)

    for room in rooms:
        usernames.add(room.creator.name)
        for rp in room.players:
            usernames.add(rp.player.name)

    usernames.remove(user.name)

    return list(usernames)
