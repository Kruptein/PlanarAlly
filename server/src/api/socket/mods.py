from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.mod import Mod
from ...db.models.mod_player_room import ModPlayerRoom
from ...db.models.mod_room import ModRoom
from ...db.models.player_room import PlayerRoom
from ...logs import logger
from ...mods.watch import publish_dev_mods
from ...state.game import game_state
from ..helpers import _send_game
from ..models.mods import ApiModLink, ApiModReplace


@sio.on("Mods.Room.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_mod_from_room(sid: str, raw_data: Any):
    pr: PlayerRoom = game_state.get(sid)

    data = ApiModLink(**raw_data)

    mod = Mod.get_or_none(tag=data.tag, version=data.version, hash=data.hash)
    if not mod:
        logger.warning(f"Mod {data.tag} {data.version} {data.hash} not found during remove stage in DB")
        return

    ModRoom.delete().where(ModRoom.room == pr.room, ModRoom.mod == mod).execute()
    await _send_game(
        "Mods.Room.Removed",
        ApiModLink(tag=mod.tag, version=mod.version, hash=mod.hash).model_dump(),
        room=pr.room.get_path(),
    )


@sio.on("Mods.Room.Link", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def link_mod_to_room(sid: str, data: Any):
    pr: PlayerRoom = game_state.get(sid)

    mod_link = ApiModLink(**data)

    mod = Mod.get_or_none(tag=mod_link.tag, version=mod_link.version, hash=mod_link.hash)
    if not mod:
        logger.warning(f"Mod {mod_link.tag} {mod_link.version} {mod_link.hash} not found during link stage in DB")
        return

    stale = list(
        Mod.select().join(ModRoom).where(ModRoom.room == pr.room, Mod.tag == mod.tag, Mod.id != mod.id),
    )
    if stale:
        ModRoom.delete().where(ModRoom.room == pr.room, ModRoom.mod.in_(stale)).execute()
    ModRoom.get_or_create(mod=mod, room=pr.room)
    await _send_game(
        "Mods.Room.Replaced",
        ApiModReplace(
            mod=mod.as_pydantic(),
            previous=[ApiModLink(tag=old.tag, version=old.version, hash=old.hash) for old in stale],
        ).model_dump(),
        room=pr.room.get_path(),
    )


@sio.on("Mods.Dev.Reload", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def reload_dev_mods(_sid: str):
    await publish_dev_mods(force=True)


@sio.on("Mods.Room.LinkUser", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def link_mod_to_user(sid: str, data: Any):
    pr: PlayerRoom = game_state.get(sid)

    mod_link = ApiModLink(**data)

    mod = Mod.get_or_none(tag=mod_link.tag, version=mod_link.version, hash=mod_link.hash)
    if not mod:
        logger.warning(f"Mod {mod_link.tag} {mod_link.version} {mod_link.hash} not found during link stage in DB")
        return

    ModPlayerRoom.get_or_create(mod=mod, player_room=pr)
