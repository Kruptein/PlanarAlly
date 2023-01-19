import json
from typing import Any, Dict, List, Optional

from .... import auth
from ....app import app, sio
from ....logs import logger
from ....models import Initiative, PlayerRoom
from ....models.db import db
from ....models.groups import Group
from ....models.role import Role
from ....models.shape import Shape
from ....models.shape.access import has_ownership
from ....state.game import game_state
from ...helpers import _send_game
from ...models.initiative import ApiInitiative, InitiativeAdd
from ...models.initiative.option import InitiativeOptionSet
from ...models.initiative.order import InitiativeOrderChange
from ...models.initiative.value import InitiativeValueSet
from ..constants import GAME_NS
from . import effect  # noqa: F401


def sort_initiative(data, sort: int):
    if sort == 2:
        return data
    return sorted(data, key=lambda x: x.get("initiative", 0) or 0, reverse=sort == 0)


async def send_initiative(data: ApiInitiative, pr: PlayerRoom):
    await _send_game("Initiative.Set", data, room=pr.active_location.get_path())


async def check_initiative(uuids: List[str], pr: PlayerRoom):
    location_data = Initiative.get_or_none(location=pr.active_location)
    if location_data is not None:
        json_data = json.loads(location_data.data)
        if any(data["shape"] in uuids for data in json_data):
            await send_initiative(location_data.as_pydantic(), pr)


def get_turn_order(data: List[Dict[str, Any]], shape: str) -> int:
    for i, info in enumerate(data):
        if info["shape"] == shape:
            return i
    raise IndexError()


@sio.on("Initiative.Request", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def request_initiatives(sid: str):
    pr = game_state.get(sid)

    await _send_game(
        "Initiative.Request",
        None,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Initiative.Option.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_initiative_option(sid: str, raw_data: Any):
    data = InitiativeOptionSet(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to update initiative option for unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to change initiative of an asset it does not own"
        )
        return

    location_data = Initiative.get_or_none(location=pr.active_location)
    if location_data is None:
        logger.error("Initiative updated for location without initiative tracking")
        return

    json_data = json.loads(location_data.data)

    with db.atomic():
        for i, initiative_data in enumerate(json_data):
            if initiative_data["shape"] == data.shape:
                json_data[i][data.option] = data.value
                break

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Option.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Initiative.Active.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_initiative_active(sid: str, is_active: bool):
    pr = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set initiative active state")
        return

    with db.atomic():
        location_data, _ = Initiative.get_or_create(
            location=pr.active_location, defaults={"round": 0, "turn": 0, "data": "[]"}
        )
        location_data.is_active = is_active
        location_data.save()

    await _send_game(
        "Initiative.Active.Set",
        is_active,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Initiative.Add", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_initiative(sid: str, raw_data: Any):
    data = InitiativeAdd(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to add initiative for unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to add initiative to an asset it does not own"
        )
        return

    with db.atomic():
        location_data, _ = Initiative.get_or_create(
            location=pr.active_location, defaults={"round": 0, "turn": 0, "data": "[]"}
        )
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            if initiative["shape"] == data.shape:
                initiative.update(**data)
                break
        else:
            json_data.append(data)

        location_data.data = json.dumps(json_data)
        location_data.save()

    await send_initiative(location_data.as_pydantic(), pr)


@sio.on("Initiative.Value.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_initiative_value(sid: str, raw_data: Any):
    data = InitiativeValueSet(**raw_data)

    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data.shape)

    if shape is None:
        logger.warning("Attempt to update initiative value for unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to remove initiative of an asset it does not own"
        )
        return

    with db.atomic():
        location_data: Initiative = Initiative.get(location=pr.active_location)
        json_data = json.loads(location_data.data)

        active_participant = json_data[location_data.turn]

        for initiative in json_data:
            if initiative["shape"] == data.shape:
                initiative["initiative"] = data.value
                break

        json_data = sort_initiative(json_data, location_data.sort)

        turn_order = get_turn_order(json_data, active_participant["shape"])
        if location_data.turn != turn_order:
            location_data.turn = turn_order

        location_data.data = json.dumps(json_data)
        location_data.save()

    await send_initiative(location_data.as_pydantic(), pr)


@sio.on("Initiative.Clear", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def clear_initiatives(sid: str):
    pr = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to clear all initiatives")
        return

    with db.atomic():
        location_data = Initiative.get(location=pr.active_location)
        json_data = json.loads(location_data.data)

        for initiative in json_data:
            initiative["initiative"] = None

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game("Initiative.Clear", None, room=pr.active_location.get_path())


async def remove_shape(pr: PlayerRoom, uuid: str, group: Optional[Group]):
    location_data = Initiative.get_or_none(location=pr.active_location)
    if location_data is None:
        return
    try:
        json_data = json.loads(location_data.data)
    except json.JSONDecodeError:
        logger.warning(
            "Invalid initiative data found during shape removal",
            pr.room.id,
            pr.active_location.id,
        )
        return

    modified = False
    new_json_data = []
    for data in json_data:
        if data["shape"] == uuid:
            if group is not None and data["isGroup"]:
                members = group.members.where(Shape.uuid != uuid)
                if len(members) > 0:
                    # change initiative member
                    data["shape"] = members[0].uuid
                    modified = True
                    new_json_data.append(data)
                    continue
            # remove shape (either because not group OR last group member)
            modified = True
            continue
        else:
            new_json_data.append(data)
    if modified:
        location_data.data = json.dumps(new_json_data)
        location_data.save()
        await send_initiative(location_data.as_pydantic(), pr)


@sio.on("Initiative.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_initiative(sid: str, data: str):
    pr = game_state.get(sid)

    shape = Shape.get_or_none(uuid=data)

    if shape is None:
        logger.warning("Attempt to remove initiative for unknown shape")
        return

    if not has_ownership(shape, pr):
        logger.warning(
            f"{pr.player.name} attempted to remove initiative of an asset it does not own"
        )
        return

    with db.atomic():
        location_data = Initiative.get(location=pr.active_location)
        json_data = json.loads(location_data.data)
        location_data.data = json.dumps(
            [initiative for initiative in json_data if initiative["shape"] != data]
        )
        location_data.save()

    await _send_game(
        "Initiative.Remove", data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Initiative.Order.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_initiative_order(sid: str, raw_data: Any):
    data = InitiativeOrderChange(**raw_data)

    pr = game_state.get(sid)

    if Shape.get_or_none(data.shape) is None:
        logger.warning("Attempt to change initiative order for unknown shape")
        return

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to reorder initiatives")
        return

    old_index = data.oldIndex
    new_index = data.newIndex

    with db.atomic():
        location_data = Initiative.get(location=pr.active_location)
        json_data = json.loads(location_data.data)

        if json_data[old_index]["shape"] != data.shape:
            return

        active_participant = json_data[location_data.turn]

        if json_data[new_index].get("initiative", 0) != json_data[old_index].get(
            "initiative", 0
        ):
            location_data.sort = 2

        json_data.insert(new_index, json_data.pop(old_index))

        json_data = sort_initiative(json_data, location_data.sort)

        turn_order = get_turn_order(json_data, active_participant["shape"])
        if location_data.turn != turn_order:
            location_data.turn = turn_order

        location_data.data = json.dumps(json_data)
        location_data.save()

    await send_initiative(location_data.as_pydantic(), pr)


@sio.on("Initiative.Turn.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_initiative_turn(sid: str, turn: int):
    pr = game_state.get(sid)

    location_data: Initiative = Initiative.get(location=pr.active_location)
    json_data = json.loads(location_data.data)

    shape = Shape.get_or_none(uuid=json_data[location_data.turn]["shape"])

    if shape is None:
        logger.warning("Attempt to modify the initiative turn for an unknown shape")

    if shape is not None and pr.role != Role.DM and not has_ownership(shape, pr):
        logger.warning(f"{pr.player.name} attempted to advance the initiative tracker")
        return

    with db.atomic():
        next_turn = turn > location_data.turn
        location_data.turn = turn

        for i, _effect in enumerate(json_data[turn]["effects"][-1:]):
            try:
                turns = int(_effect["turns"])
                if turns <= 0 and next_turn:
                    json_data[turn]["effects"].pop(i)
                elif turns > 0 and next_turn:
                    _effect["turns"] = str(turns - 1)
                else:
                    _effect["turns"] = str(turns + 1)
            except ValueError:
                # For non-number inputs do not update the effect
                pass

        location_data.data = json.dumps(json_data)

        location_data.save()

    await _send_game(
        "Initiative.Turn.Update", turn, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("Initiative.Round.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_initiative_round(sid: str, data: int):
    pr = game_state.get(sid)

    location_data = Initiative.get(location=pr.active_location)

    if pr.role != Role.DM:
        json_data = json.loads(location_data.data)

        shape = Shape.get_or_none(uuid=json_data[location_data.turn]["shape"])

        if shape is None:
            logger.warning(
                "Attempt to modify the initiative round for an unknown shape"
            )
            return

        if not has_ownership(shape, pr):
            logger.warning(
                f"{pr.player.name} attempted to advance the initiative tracker"
            )
            return

    with db.atomic():
        location_data.round = data
        location_data.save()

    await _send_game(
        "Initiative.Round.Update",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )


@sio.on("Initiative.Sort.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_initiative_sort(sid: str, sort: int):
    pr = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change initiative sort")
        return

    with db.atomic():
        location_data = Initiative.get(location=pr.active_location)
        location_data.sort = sort
        json_data = json.loads(location_data.data)

        active_participant = json_data[location_data.turn]

        json_data = sort_initiative(json_data, location_data.sort)

        turn_order = get_turn_order(json_data, active_participant["shape"])
        if location_data.turn != turn_order:
            location_data.turn = turn_order

        location_data.data = json.dumps(json_data)
        location_data.save()

    await _send_game(
        "Initiative.Sort.Set", sort, room=pr.active_location.get_path(), skip_sid=sid
    )
    await send_initiative(location_data.as_pydantic(), pr)
