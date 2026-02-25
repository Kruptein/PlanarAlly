from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.asset_entry import AssetEntry
from ...db.models.asset_shortcut import AssetShortcut
from ...db.models.player_room import PlayerRoom
from ...state.game import game_state
from ..models.asset.options import (
    AssetTemplatesInfoFail,
    AssetTemplatesInfoRequest,
    AssetTemplatesInfoSuccess,
    AssetTemplateInfo,
)


@sio.on("Asset.Templates.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_asset_options(sid: str, raw_data: Any):
    data = AssetTemplatesInfoRequest(**raw_data)

    entry = AssetEntry.get_or_none(id=data.entryId)
    if entry is None:
        return AssetTemplatesInfoFail(success=False, error="AssetNotFound")
    name = entry.name
    asset = entry.asset

    if asset is None:
        options = AssetTemplatesInfoFail(success=False, error="AssetNotFound")
    else:
        templates = [AssetTemplateInfo(name=template.name, id=template.shape_id) for template in asset.templates]
        options = AssetTemplatesInfoSuccess(success=True, name=name, templates=templates)

    return options


@sio.on("Asset.Shortcut.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_asset_shortcut(sid: str, asset_id: int):
    pr: PlayerRoom = game_state.get(sid)

    entry = AssetEntry.get_or_none(id=asset_id)
    if entry is None or entry.asset is None:
        return

    AssetShortcut.create(
        asset_entry=entry,
        player_room=pr,
    )


@sio.on("Asset.Shortcut.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_asset_shortcut(sid: str, asset_id: int):
    pr: PlayerRoom = game_state.get(sid)

    entry = AssetEntry.get_or_none(id=asset_id)
    if entry is None or entry.asset is None:
        return

    AssetShortcut.delete().where(
        AssetShortcut.entry == entry,
        AssetShortcut.player_room == pr,
    ).execute()
