from typing import Any, Optional

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import Asset, PlayerRoom
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.asset.options import (
    AssetOptionsInfoFail,
    AssetOptionsInfoSuccess,
    AssetOptionsSet,
)
from ..models.helpers import _


@sio.on("Asset.Options.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_asset_options(sid: str, asset_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to request asset options")
        return

    asset: Optional[Asset] = Asset.get_or_none(id=asset_id)

    if asset is None:
        options = AssetOptionsInfoFail(success=False, error="AssetNotFound")
    else:
        options = AssetOptionsInfoSuccess(
            success=True, name=asset.name, options=_(asset.options)
        )

    await _send_game("Asset.Options.Info", options, room=sid)


@sio.on("Asset.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_asset_options(sid: str, raw_data: Any):
    asset_options = AssetOptionsSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set asset options")
        return

    asset = Asset.get_or_none(id=asset_options.asset)
    if asset is None:
        asset = Asset.create(
            name="T",
            owner=game_state.get_user(sid),
        )
    asset.options = asset_options.options
    asset.save()
