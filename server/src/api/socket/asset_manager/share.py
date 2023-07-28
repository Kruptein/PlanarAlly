from typing import Any

from .... import auth
from ....app import app, sio
from ....db.models.asset import Asset
from ....db.models.asset_share import AssetShare
from ....db.models.user import User
from ....logs import logger
from ....state.asset import asset_state
from ...models.asset.share import ApiAssetShare
from ..constants import ASSET_NS


@sio.on("Asset.Share", namespace=ASSET_NS)
@auth.login_required(app, sio, "asset")
async def share_asset(sid: str, raw_data: Any):
    initiating_user = asset_state.get_user(sid)

    data = ApiAssetShare(**raw_data)

    user = User.by_name(data.user)
    if user is None:
        return {"success": False, "reason": "Username does not exist"}
    elif user == initiating_user:
        return {"success": False, "reason": "Sharing with yourself is not valid"}

    try:
        asset = Asset.get_by_id(data.asset)
    except Asset.DoesNotExist:
        return {"success": False, "reason": "Asset does not exist"}

    if asset.owner != initiating_user:
        return {"success": False, "reason": "You do not own this asset"}

    try:
        AssetShare.create(
            asset=asset,
            user=user,
            right=data.right,
            name=f"{initiating_user.name}-{asset.name}",
            parent=Asset.get_root_folder(user),
        )
    except:
        logger.exception("Failed to creater Asset share")
        return {"success": False, "reason": "Failed to create Asset Share"}

    return {"success": True}
