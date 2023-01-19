from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import Label, LabelSelection, PlayerRoom, User
from ...state.game import game_state
from ..helpers import _send_game
from ..models.label import ApiLabel, LabelVisibilitySet


@sio.on("Label.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add(sid: str, raw_data: Any):
    data = ApiLabel(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=data)

    if label is not None:
        logger.warn(
            f"{pr.player.name} tried to add a label with an id that already exists."
        )
        return

    if data.user != pr.player.name:
        logger.warn(f"{pr.player.name} tried to add a label for someone else.")
        return

    new_data = data.dict()
    new_data["user"] = User.by_name(data.user)
    label = Label.create(**new_data)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player or label.visible:
            await _send_game("Label.Add", label.as_pydantic(), room=psid)


@sio.on("Label.Delete", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete(sid: str, label_id: str):

    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=label_id)

    if label is None:
        logger.warn(f"{pr.player.name} tried to delete a non-existing label.")
        return
    elif label.user != pr.player:
        logger.warn(f"{pr.player.name} tried to delete another user's label.")
        return

    label.delete_instance(True)

    await _send_game("Label.Delete", label_id, room=sid, skip_sid=sid)


@sio.on("Label.Visibility.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_visibility(sid: str, raw_data: Any):
    data = LabelVisibilitySet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=data.uuid)

    if label is None:
        logger.warn(f"{pr.player.name} tried to change a non-existing label.")
        return
    elif label.user != pr.player:
        logger.warn(f"{pr.player.name} tried to change another user's label.")
        return

    label.visible = data.visible
    label.save()

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await _send_game("Label.Visibility.Set", raw_data, room=psid)
        else:
            if data.visible:
                await _send_game("Label.Add", label.as_pydantic(), room=psid)
            else:
                await _send_game("Label.Delete", label.uuid, room=psid)


@sio.on("Labels.Filter.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_filter(sid: str, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=uuid)

    LabelSelection.create(label=label, user=pr.player, room=pr.room)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await _send_game("Labels.Filter.Add", uuid, room=psid)


@sio.on("Labels.Filter.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_filter(sid: str, uuid: str):
    pr: PlayerRoom = game_state.get(sid)

    label = Label.get_or_none(uuid=uuid)

    ls = LabelSelection.get_or_none(label=label, room=pr.room, user=pr.player)

    if ls:
        ls.delete_instance(True)

    for psid in game_state.get_sids(skip_sid=sid, room=pr.room):
        if game_state.get_user(psid) == pr.player:
            await _send_game("Labels.Filter.Remove", uuid, room=psid)
