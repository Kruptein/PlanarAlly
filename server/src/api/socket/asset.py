from typing import Any, Optional

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.asset import Asset
from ...db.models.asset_shortcut import AssetShortcut
from ...db.models.player_room import PlayerRoom
from ...logs import logger
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.asset.options import (
    AssetOptionsInfoFail,
    AssetOptionsInfoSuccess,
    AssetOptionsSet,
)


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
            success=True, name=asset.name, options=asset.options
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


@sio.on("Asset.Shortcut.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_asset_shortcut(sid: str, asset_id: int):
    pr: PlayerRoom = game_state.get(sid)

    asset = Asset.get_or_none(id=asset_id)
    if asset is None:
        return

    AssetShortcut.create(
        asset=asset,
        player_room=pr,
    )


@sio.on("Asset.Shortcut.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_asset_shortcut(sid: str, asset_id: int):
    pr: PlayerRoom = game_state.get(sid)

    asset = Asset.get_or_none(id=asset_id)
    if asset is None:
        return

    AssetShortcut.delete().where(
        AssetShortcut.asset == asset,
        AssetShortcut.player_room == pr,
    ).execute()
