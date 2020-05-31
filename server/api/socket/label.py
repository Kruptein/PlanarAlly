from typing import Any, Dict

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import Label, LabelSelection, PlayerRoom, User
from models.db import db
from models.role import Role
from state.game import game_state


@sio.on("Label.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=data)

    if label is not None:
        logger.warn(
            f"{pr.player.name} tried to add a label with an id that already exists."
        )
        return

    if data["user"] != pr.player.name:
        logger.warn(f"{pr.player.name} tried to add a label for someone else.")
        return

    data["user"] = User.by_name(data["user"])
    label = Label.create(**data)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player or label.visible:
            await sio.emit("Label.Add", label.as_dict(), room=psid, namespace=GAME_NS)


@sio.on("Label.Delete", namespace=GAME_NS)
@auth.login_required(app, sio)
async def delete(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=data)

    if label is None:
        logger.warn(f"{pr.player.name} tried to delete a non-existing label.")
        return

    if label.user != pr.player:
        logger.warn(f"{pr.player.name} tried to delete another user's label.")
        return

    label.delete_instance(True)

    await sio.emit(
        "Label.Delete",
        {"user": pr.player.name, "uuid": data},
        skip_sid=sid,
        namespace=GAME_NS,
    )


@sio.on("Label.Visibility.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_visibility(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=data["uuid"])

    if label is None:
        logger.warn(f"{pr.player.name} tried to change a non-existing label.")
        return

    if label.user != pr.player:
        logger.warn(f"{pr.player.name} tried to change another user's label.")
        return

    label.visible = data["visible"]
    label.save()

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await sio.emit(
                "Label.Visibility.Set",
                {"user": label.pr.player.name, **data},
                room=psid,
                namespace=GAME_NS,
            )
        else:
            if data["visible"]:
                await sio.emit(
                    "Label.Add", label.as_dict(), room=psid, namespace=GAME_NS
                )
            else:
                await sio.emit(
                    "Label.Delete",
                    {"uuid": label.uuid, "user": label.pr.player.name},
                    room=psid,
                    namespace=GAME_NS,
                )


@sio.on("Labels.Filter.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_filter(sid: int, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=uuid)

    LabelSelection.create(label=label, user=pr.player, room=pr.room)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await sio.emit("Labels.Filter.Add", uuid, room=psid, namespace=GAME_NS)


@sio.on("Labels.Filter.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_filter(sid: int, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=uuid)

    ls = LabelSelection.get_or_none(label=label, room=pr.room, user=pr.player)

    if ls:
        ls.delete_instance(True)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await sio.emit("Labels.Filter.Remove", uuid, room=psid, namespace=GAME_NS)
