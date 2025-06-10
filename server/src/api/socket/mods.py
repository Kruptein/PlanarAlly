from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.models.mod import Mod
from ...db.models.mod_player_room import ModPlayerRoom
from ...db.models.mod_room import ModRoom
from ...db.models.player_room import PlayerRoom
from ...logs import logger
from ...state.game import game_state
from ..models.mods import ApiModLink


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


@sio.on("Mods.Room.Link", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def link_mod_to_room(sid: str, data: Any):
    pr: PlayerRoom = game_state.get(sid)

    mod_link = ApiModLink(**data)

    mod = Mod.get_or_none(tag=mod_link.tag, version=mod_link.version, hash=mod_link.hash)
    if not mod:
        logger.warning(f"Mod {mod_link.tag} {mod_link.version} {mod_link.hash} not found during link stage in DB")
        return

    ModRoom.get_or_create(mod=mod, room=pr.room)


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
