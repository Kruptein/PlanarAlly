import json
from typing import Any, List, Optional

from .... import auth
from ....api.helpers import _send_game
from ....app import app, sio
from ....db.models.aura import Aura
from ....db.models.player_room import PlayerRoom
from ....db.models.shape import Shape
from ....db.models.tracker import Tracker
from ....db.typed import safe_update_model_from_dict
from ....db.utils import reduce_data_to_model
from ....state.game import game_state
from ...models.aura import ApiAura, ApiOptionalAura, AuraMove, ShapeSetAuraValue
from ...models.shape.options import (
    ShapeSetBooleanValue,
    ShapeSetDoorToggleModeValue,
    ShapeSetIntegerValue,
    ShapeSetOptionalStringValue,
    ShapeSetPermissionValue,
    ShapeSetStringValue,
    ShapeSetTeleportLocationValue,
)
from ...models.tracker import (
    ApiOptionalTracker,
    ApiTracker,
    ShapeSetTrackerValue,
    TrackerMove,
)
from ..constants import GAME_NS
from .utils import get_owner_sids, get_shape_or_none


async def send_name(
    data: ShapeSetStringValue,
    *,
    room: str,
    skip_sid: Optional[str] = None,
):
    await _send_game("Shape.Options.Name.Set", data, room=room, skip_sid=skip_sid)


async def send_new_tracker(
    data: ApiTracker, *, room: str, skip_sid: Optional[str] = None
):
    await _send_game("Shape.Options.Tracker.Create", data, room=room, skip_sid=skip_sid)


async def send_new_aura(data: ApiAura, *, room: str, skip_sid: Optional[str] = None):
    await _send_game("Shape.Options.Aura.Create", data, room=room, skip_sid=skip_sid)


@sio.on("Shape.Options.Invisible.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_invisible(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Invisible.Set")
    if shape is None:
        return

    shape.is_invisible = data.value
    shape.save()

    await _send_game(
        "Shape.Options.Invisible.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Defeated.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_defeated(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Defeated.Set")
    if shape is None:
        return

    shape.is_defeated = data.value
    shape.save()

    await _send_game(
        "Shape.Options.Defeated.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.OddHexOrientation.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_odd_hex_orientation(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "OddHexOrientation.Set")
    if shape is None:
        return

    shape.odd_hex_orientation = data.value
    shape.save()

    await _send_game(
        "Shape.Options.OddHexOrientation.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Size.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_size(sid: str, raw_data: Any):
    data = ShapeSetIntegerValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Size.Set")
    if shape is None:
        return

    shape.size = data.value
    shape.save()

    await _send_game(
        "Shape.Options.Size.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.ShowCells.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_cells(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "ShowCells.Set")
    if shape is None:
        return

    shape.show_cells = data.value
    shape.save()

    await _send_game(
        "Shape.Options.ShowCells.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.CellFillColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_cell_fill_colour(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "CellFillColour.Set")
    if shape is None:
        return

    shape.cell_fill_colour = data.value
    shape.save()

    await _send_game(
        "Shape.Options.CellFillColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.CellStrokeColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_cell_stroke_colour(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "CellStrokeColour.Set")
    if shape is None:
        return

    shape.cell_stroke_colour = data.value
    shape.save()

    await _send_game(
        "Shape.Options.CellStrokeColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.CellStrokeWidth.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_cell_stroke_width(sid: str, raw_data: Any):
    data = ShapeSetIntegerValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "CellStrokeWidth.Set")
    if shape is None:
        return

    shape.cell_stroke_width = data.value
    shape.save()

    await _send_game(
        "Shape.Options.CellStrokeWidth.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Locked.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_locked(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Locked.Set")
    if shape is None:
        return

    shape.is_locked = data.value
    shape.save()

    await _send_game(
        "Shape.Options.Locked.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Token.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_token(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Token.Set")
    if shape is None:
        return

    shape.is_token = data.value
    shape.save()

    await _send_game(
        "Shape.Options.Token.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.MovementBlock.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_movement_block(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "MovementBlock.Set")
    if shape is None:
        return

    shape.movement_obstruction = data.value
    shape.save()

    await _send_game(
        "Shape.Options.MovementBlock.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.VisionBlock.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_vision_block(sid: str, raw_data: Any):
    data = ShapeSetIntegerValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "VisionBlock.Set")
    if shape is None:
        return

    shape.vision_obstruction = data.value
    shape.save()

    await _send_game(
        "Shape.Options.VisionBlock.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Tracker.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_tracker(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Tracker.Remove")
    if shape is None:
        return

    tracker: Tracker = Tracker.get_by_id(data.value)
    tracker.delete_instance(True)

    await _send_game(
        "Shape.Options.Tracker.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Aura.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_aura(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Aura.Remove")
    if shape is None:
        return

    aura = Aura.get_by_id(data.value)
    aura.delete_instance(True)

    await _send_game(
        "Shape.Options.Aura.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Name.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_name(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Name.Set")
    if shape is None:
        return

    shape.name = data.value
    shape.save()

    if shape.name_visible:
        await send_name(data, room=pr.active_location.get_path(), skip_sid=sid)
    else:
        for sid in get_owner_sids(pr, shape, skip_sid=sid):
            await send_name(data, room=sid)


@sio.on("Shape.Options.NameVisible.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_name_visible(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "NameVisible.Set")
    if shape is None:
        return

    shape.name_visible = data.value
    shape.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]

    await _send_game(
        "Shape.Options.NameVisible.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )

    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        await send_name(
            ShapeSetStringValue(
                shape=shape.uuid, value=(shape.name or "?") if data.value else "?"
            ),
            room=psid,
        )


@sio.on("Shape.Options.ShowBadge.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_show_badge(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "ShowBadge.Set")
    if shape is None:
        return

    shape.show_badge = data.value
    shape.save()

    await _send_game(
        "Shape.Options.ShowBadge.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.StrokeColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_stroke_colour(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "StrokeColour.Set")
    if shape is None:
        return

    shape.stroke_colour = data.value
    shape.save()

    await _send_game(
        "Shape.Options.StrokeColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.FillColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_fill_colour(sid: str, raw_data: Any):
    data = ShapeSetStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "FillColour.Set")
    if shape is None:
        return

    shape.fill_colour = data.value
    shape.save()

    await _send_game(
        "Shape.Options.FillColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Tracker.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_tracker(sid: str, raw_data: Any):
    data = ApiTracker(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Tracker.Create")
    if shape is None:
        return

    model = reduce_data_to_model(Tracker, data.dict())
    tracker = Tracker.create(**model)
    tracker.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await send_new_tracker(data, room=psid)
    if tracker.visible:
        for psid in game_state.get_sids(
            active_location=pr.active_location, skip_sid=sid
        ):
            if psid in owners:
                continue
            await send_new_tracker(data, room=psid)


@sio.on("Shape.Options.Tracker.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_tracker(sid: str, raw_data: Any):
    data = ApiOptionalTracker(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Tracker.Update")
    if shape is None:
        return

    tracker = Tracker.get_by_id(data.uuid)

    changed_visible = False
    if data.visible is not None and data.visible != tracker.visible:
        changed_visible = True

    # don't use data.dict() as it contains a bunch of None's
    safe_update_model_from_dict(tracker, raw_data)
    tracker.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await _send_game(
            "Shape.Options.Tracker.Update",
            raw_data,
            room=psid,
        )
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        if changed_visible:
            if tracker.visible:
                await send_new_tracker(tracker.as_pydantic(), room=psid)
            else:
                await _send_game(
                    "Shape.Options.Tracker.Remove",
                    ShapeSetTrackerValue(shape=shape.uuid, value=tracker.uuid),
                    room=psid,
                )
        else:
            await _send_game("Shape.Options.Tracker.Update", raw_data, room=psid)


@sio.on("Shape.Options.Tracker.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_tracker(sid: str, raw_data: Any):
    data = TrackerMove(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    new_shape = get_shape_or_none(pr, data.new_shape, "Tracker.Options.Tracker.Move")
    if new_shape is None:
        return

    tracker = Tracker.get_by_id(data.tracker)
    tracker.shape = new_shape
    tracker.save()

    await _send_game(
        "Shape.Options.Tracker.Move",
        raw_data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Aura.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_aura(sid: str, raw_data: Any):
    data = ApiAura(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Aura.Create")
    if shape is None:
        return

    model = reduce_data_to_model(Aura, data.dict())
    aura = Aura.create(**model)
    aura.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await send_new_aura(data, room=psid)
    if aura.visible:
        for psid in game_state.get_sids(
            active_location=pr.active_location, skip_sid=sid
        ):
            if psid in owners:
                continue
            await send_new_aura(data, room=psid)


@sio.on("Shape.Options.Aura.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_aura(sid: str, raw_data: Any):
    data = ApiOptionalAura(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Aura.Update")
    if shape is None:
        return

    aura = Aura.get_by_id(data.uuid)

    changed_visible = False
    if data.visible is not None and data.visible != aura.visible:
        changed_visible = True

    # don't use data.dict() as it contains a bunch of None's
    safe_update_model_from_dict(aura, raw_data)
    aura.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await _send_game("Shape.Options.Aura.Update", raw_data, room=psid)
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        if changed_visible:
            if aura.visible:
                await send_new_aura(aura.as_pydantic(), room=psid)
            else:
                await _send_game(
                    "Shape.Options.Aura.Remove",
                    ShapeSetAuraValue(shape=shape.uuid, value=aura.uuid),
                    room=psid,
                )
        else:
            await _send_game("Shape.Options.Aura.Update", raw_data, room=psid)


@sio.on("Shape.Options.Aura.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_aura(sid: str, raw_data: Any):
    data = AuraMove(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    new_shape = get_shape_or_none(pr, data.new_shape, "Aura.Options.Tracker.Move")
    if new_shape is None:
        return

    aura = Aura.get_by_id(data.aura)
    aura.shape = new_shape
    aura.save()

    await _send_game(
        "Shape.Options.Aura.Move",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.IsDoor.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_is_door(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "IsDoor.Set")
    if shape is None:
        return

    shape.is_door = data.value
    shape.save()

    await _send_game(
        "Shape.Options.IsDoor.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


def set_options(shape: Shape, key: str, value):
    options: list[list[Any]] = json.loads(shape.options or "[]")
    for option in options:
        if option[0] == key:
            option[1] = value
            break
    else:
        options.append([key, value])
    shape.options = json.dumps(options)
    shape.save()


def set_options_deep(shape: Shape, key: str, subkey: str, value: dict | str | int):
    options: List[Any] = json.loads(shape.options or "[]")
    for option in options:
        if option[0] == key:
            option[1][subkey] = value
            break
    else:
        options.append([key, {subkey: value}])

    shape.options = json.dumps(options)
    shape.save()


@sio.on("Shape.Options.Door.Permissions.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_door_permissions(sid: str, raw_data: Any):
    data = ShapeSetPermissionValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Door.Permissions.Set")
    if shape is None:
        return

    set_options_deep(shape, "door", "permissions", data.value.dict())

    await _send_game(
        "Shape.Options.Door.Permissions.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.Door.ToggleMode.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_door_toggle_mode(sid: str, raw_data: Any):
    data = ShapeSetDoorToggleModeValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "Door.ToggleMode.Set")
    if shape is None:
        return

    set_options_deep(shape, "door", "toggleMode", data.value)

    await _send_game(
        "Shape.Options.Door.ToggleMode.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.IsTeleportZone.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_is_teleport_zone(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "IsTeleportZone.Set")
    if shape is None:
        return

    shape.is_teleport_zone = data.value
    shape.save()

    await _send_game(
        "Shape.Options.IsTeleportZone.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.IsImmediateTeleportZone.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_is_immediate_teleport_zone(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "IsTeleportZone.Set")
    if shape is None:
        return

    set_options_deep(shape, "teleport", "immediate", data.value)

    await _send_game(
        "Shape.Options.IsImmediateTeleportZone.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.TeleportZonePermissions.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_tp_permissions(sid: str, raw_data: Any):
    data = ShapeSetPermissionValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "TeleportZonePermissions.Set")
    if shape is None:
        return

    set_options_deep(shape, "teleport", "permissions", data.value.dict())

    await _send_game(
        "Shape.Options.TeleportZonePermissions.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.TeleportZoneTarget.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_tp_target(sid: str, raw_data: Any):
    data = ShapeSetTeleportLocationValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "TeleportZoneTarget.Set")
    if shape is None:
        return

    set_options_deep(shape, "teleport", "location", data.value.dict())

    await _send_game(
        "Shape.Options.TeleportZoneTarget.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.SkipDraw.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_skip_draw(sid: str, raw_data: Any):
    data = ShapeSetBooleanValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "SkipDraw.Set")
    if shape is None:
        return

    set_options(shape, "skipDraw", data.value)

    await _send_game(
        "Shape.Options.SkipDraw.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("Shape.Options.SvgAsset.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_svg_asset(sid: str, raw_data: Any):
    data = ShapeSetOptionalStringValue(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "SkipDraw.Set")
    if shape is None:
        return

    options: List[Any] = json.loads(shape.options or "[]")

    for i, option in enumerate(options[::-1]):
        if data.value is None and option[0] in [
            "svgAsset",
            "svgPaths",
            "svgWidth",
            "svgHeight",
        ]:
            options.pop(i)
            break
        elif option[0] == "svgAsset":
            option[1] = data.value
            break
    else:
        options.append(["svgAsset", data.value])

    shape.options = json.dumps(options)
    shape.save()

    await _send_game(
        "Shape.Options.SvgAsset.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )
