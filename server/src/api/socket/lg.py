from typing_extensions import TypedDict

from ... import auth
from ...app import app, sio
from ...models import PlayerRoom
from ...models.role import Role
from ...state.game import game_state
from .constants import GAME_NS


class LgSpawnFile(TypedDict):
    imageSource: str
    assetId: int


class LgSpawn(TypedDict):
    type: int
    file: LgSpawnFile


class LgUuidLink(TypedDict):
    typeId: int
    uuid: str


@sio.on("Lg.Spawn.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add(sid: str, data: LgSpawn):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await sio.emit("Lg.Spawn.Add", data, room=psid, namespace=GAME_NS)


@sio.on("Lg.Spawn.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove(sid: str, data: int):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await sio.emit("Lg.Spawn.Remove", data, room=psid, namespace=GAME_NS)


@sio.on("Lg.Spawn.Do", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def spawn(sid: str, data: int):
    pr: PlayerRoom = game_state.get(sid)

    for psid, ppr in game_state.get_t(room=pr.room, skip_sid=sid):
        if ppr.role == Role.DM:
            await sio.emit("Lg.Spawn.Do", data, room=psid, namespace=GAME_NS)
            break


@sio.on("Lg.Spawn.Uuid", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def uuid(sid: str, data: int):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await sio.emit("Lg.Spawn.Uuid", data, room=psid, namespace=GAME_NS)


@sio.on("Lg.Token.Connect", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def token_connect(sid: str, data: int):
    pr: PlayerRoom = game_state.get(sid)

    for psid in game_state.get_sids(room=pr.room, skip_sid=sid):
        await sio.emit("Lg.Token.Connect", data, room=psid, namespace=GAME_NS)
