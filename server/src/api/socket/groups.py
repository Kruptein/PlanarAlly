from typing import Any, List

from playhouse.shortcuts import update_model_from_dict

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...logs import logger
from ...models import Group, PlayerRoom, Shape
from ...state.game import game_state
from ..helpers import _send_game
from ..models.floor import ApiGroup
from ..models.groups import GroupJoin, GroupLeave
from ..models.groups.members import GroupMemberBadge


@sio.on("Group.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_group(sid: str, raw_data: Any):
    data = ApiGroup(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        group = Group.get_by_id(data.uuid)
    except Group.DoesNotExist:
        logger.exception(f"Could not retrieve group information for {data.uuid}")
        return
    else:
        update_model_from_dict(group, data.dict())
        group.save()

    for psid in game_state.get_sids(room=pr.room):
        await _send_game(
            "Group.Update",
            data,
            room=psid,
            skip_sid=sid,
        )


@sio.on("Group.Members.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_group_badges(sid: str, raw_data: List[Any]):
    member_badges = [GroupMemberBadge(**data) for data in raw_data]

    pr: PlayerRoom = game_state.get(sid)

    for member in member_badges:
        try:
            shape = Shape.get_by_id(member.uuid)
        except Shape.DoesNotExist:
            logger.exception(
                f"Could not update shape badge for unknown shape {member.uuid}"
            )
        else:
            shape.badge = member.badge
            shape.save()

    for psid in game_state.get_sids(room=pr.room):
        await _send_game(
            "Group.Members.Update",
            member_badges,
            room=psid,
            skip_sid=sid,
        )


@sio.on("Group.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_group(sid: str, raw_data: Any):
    data = ApiGroup(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        Group.get_by_id(data.uuid)
        logger.exception(f"Group with {data.uuid} already exists")
        return
    except Group.DoesNotExist:
        Group.create(**data.dict())

    for psid in game_state.get_sids(room=pr.room):
        await _send_game(
            "Group.Create",
            data,
            room=psid,
            skip_sid=sid,
        )


@sio.on("Group.Join", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def join_group(sid: str, raw_data: Any):
    data = GroupJoin(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    group_ids = set()

    for member in data.members:
        try:
            shape = Shape.get_by_id(member.uuid)
        except Shape.DoesNotExist:
            logger.exception(
                f"Could not update shape group for unknown shape {member.uuid}"
            )
        else:
            if shape.group is not None and shape.group != data.group_id:
                group_ids.add(shape.group)
            shape.group = Group[data.group_id]
            shape.badge = member.badge
            shape.save()

    # Group joining can be the result of a merge or a split and thus other groups might be empty now
    for group_id in group_ids:
        await remove_group_if_empty(group_id)

    for psid in game_state.get_sids(room=pr.room):
        await _send_game(
            "Group.Join",
            data,
            room=psid,
            skip_sid=sid,
        )


@sio.on("Group.Leave", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def leave_group(sid: str, raw_data: list[Any]):
    client_shapes = [GroupLeave(**data) for data in raw_data]

    pr: PlayerRoom = game_state.get(sid)

    group_ids = set()

    for client_shape in client_shapes:
        try:
            shape = Shape.get_by_id(client_shape.uuid)
        except Shape.DoesNotExist:
            logger.exception(
                f"Could not remove shape group for unknown shape {client_shape.uuid}"
            )
        else:
            group_ids.add(client_shape.group_id)
            shape.group = None
            shape.show_badge = False
            shape.save()

    for group_id in group_ids:
        await remove_group_if_empty(group_id)

    for psid in game_state.get_sids(room=pr.room):
        await _send_game("Group.Leave", client_shapes, room=psid, skip_sid=sid)


@sio.on("Group.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_group(sid: str, group_id: str):
    pr: PlayerRoom = game_state.get(sid)

    for shape in Shape.filter(group_id=group_id).select():
        shape.group = None
        shape.show_badge = False
        shape.save()

    # check if group still has members
    await remove_group_if_empty(group_id)

    for psid, _ in game_state.get_users(room=pr.room):
        await sio.emit(
            "Group.Remove",
            group_id,
            room=psid,
            skip_sid=sid,
            namespace=GAME_NS,
        )


async def remove_group_if_empty(group_id: str):
    try:
        group = Group.get_by_id(group_id)
    except Group.DoesNotExist:
        return

    if Shape.filter(group=group_id).count() == 0:
        group.delete_instance(True)
