from typing import Any, Dict
from typing_extensions import TypedDict

from playhouse.shortcuts import update_model_from_dict

import auth
from api.socket.constants import GAME_NS
from api.socket.shape.utils import get_owner_sids, get_shape_or_none
from app import app, sio
from models import Aura, PlayerRoom, Shape, ShapeLabel, Tracker
from models.shape.access import has_ownership
from models.utils import reduce_data_to_model
from state.game import game_state
from utils import logger


class ShapeSetBooleanValue(TypedDict):
    shape: str
    value: bool


class ShapeSetStringValue(TypedDict):
    shape: str
    value: str


class ShapeAuraSetBooleanValue(TypedDict):
    shape: str
    aura: str
    value: bool


class TrackerData(TypedDict):
    uuid: str
    shape: str


class TrackerDelta(TrackerData, total=False):
    visible: bool
    name: str
    value: int
    maxvalue: int


class AuraData(TypedDict):
    uuid: str
    shape: str


class AuraDelta(AuraData, total=False):
    vision_source: bool
    visible: bool
    name: str
    value: int
    dim: int
    colour: str


@sio.on("Shape.Options.Invisible.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_invisible(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Invisible.Set")
    if shape is None:
        return

    shape.is_invisible = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.Invisible.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Locked.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_locked(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Locked.Set")
    if shape is None:
        return

    shape.is_locked = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.Locked.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Token.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_token(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Token.Set")
    if shape is None:
        return

    shape.is_token = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.Token.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.MovementBlock.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_movement_block(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "MovementBlock.Set")
    if shape is None:
        return

    shape.movement_obstruction = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.MovementBlock.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.VisionBlock.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_vision_block(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "VisionBlock.Set")
    if shape is None:
        return

    shape.vision_obstruction = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.VisionBlock.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Annotation.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_annotation(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Annotation.Set")
    if shape is None:
        return

    shape.annotation = data["value"]
    shape.save()

    for sid in get_owner_sids(pr, shape, skip_sid=sid):
        await sio.emit(
            "Shape.Options.Annotation.Set", data, room=sid, namespace=GAME_NS,
        )


@sio.on("Shape.Options.Tracker.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_tracker(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Tracker.Remove")
    if shape is None:
        return

    tracker: Tracker = Tracker.get_by_id(data["value"])
    tracker.delete_instance(True)

    await sio.emit(
        "Shape.Options.Tracker.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Aura.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_aura(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Aura.Remove")
    if shape is None:
        return

    aura = Aura.get_by_id(data["value"])
    aura.delete_instance(True)

    await sio.emit(
        "Shape.Options.Aura.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Label.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_label(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Label.Remove")
    if shape is None:
        return

    label = ShapeLabel.get_by_id(data["value"])
    label.delete_instance(True)

    await sio.emit(
        "Shape.Options.Label.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Name.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_name(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Name.Set")
    if shape is None:
        return

    shape.name = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.Name.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.NameVisible.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_name_visible(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "NameVisible.Set")
    if shape is None:
        return

    shape.name_visible = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.NameVisible.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.ShowBadge.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_show_badge(sid: str, data: ShapeSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "ShowBadge.Set")
    if shape is None:
        return

    shape.show_badge = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.ShowBadge.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.StrokeColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_stroke_colour(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "StrokeColour.Set")
    if shape is None:
        return

    shape.stroke_colour = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.StrokeColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.FillColour.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_fill_colour(sid: str, data: ShapeSetStringValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "FillColour.Set")
    if shape is None:
        return

    shape.fill_colour = data["value"]
    shape.save()

    await sio.emit(
        "Shape.Options.FillColour.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("Shape.Options.Tracker.Create", namespace=GAME_NS)
@auth.login_required(app, sio)
async def create_tracker(sid: str, data: TrackerDelta):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Tracker.Create")
    if shape is None:
        return

    model = reduce_data_to_model(Tracker, data)
    tracker = Tracker.create(**model)
    tracker.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await sio.emit(
            "Shape.Options.Tracker.Create", data, room=psid, namespace=GAME_NS,
        )
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        await sio.emit(
            "Shape.Options.Tracker.Create", data, room=sid, namespace=GAME_NS,
        )


@sio.on("Shape.Options.Tracker.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_tracker(sid: str, data: TrackerDelta):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Tracker.Update")
    if shape is None:
        return

    tracker = Tracker.get_by_id(data["uuid"])
    changed_visible = tracker.visible != data.get("visible", tracker.visible)
    update_model_from_dict(tracker, data)
    tracker.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await sio.emit(
            "Shape.Options.Tracker.Update", data, room=psid, namespace=GAME_NS,
        )
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        if changed_visible:
            if tracker.visible:
                await sio.emit(
                    "Shape.Options.Tracker.Create",
                    {"shape": shape.uuid, **tracker.as_dict()},
                    room=psid,
                    namespace=GAME_NS,
                )
            else:
                await sio.emit(
                    "Shape.Options.Tracker.Remove",
                    {"shape": shape.uuid, "value": tracker.uuid},
                    room=psid,
                    namespace=GAME_NS,
                )
        else:
            await sio.emit(
                "Shape.Options.Tracker.Update", data, room=psid, namespace=GAME_NS,
            )


@sio.on("Shape.Options.Aura.Create", namespace=GAME_NS)
@auth.login_required(app, sio)
async def create_aura(sid: str, data: AuraDelta):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Aura.Create")
    if shape is None:
        return

    model = reduce_data_to_model(Aura, data)
    aura = Aura.create(**model)
    aura.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await sio.emit(
            "Shape.Options.Aura.Create", data, room=psid, namespace=GAME_NS,
        )
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        await sio.emit(
            "Shape.Options.Aura.Create", data, room=sid, namespace=GAME_NS,
        )


@sio.on("Shape.Options.Aura.Update", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_aura(sid: str, data: AuraDelta):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Aura.Update")
    if shape is None:
        return

    aura = Aura.get_by_id(data["uuid"])
    changed_visible = aura.visible != data.get("visible", aura.visible)
    update_model_from_dict(aura, data)
    aura.save()

    owners = [*get_owner_sids(pr, shape, skip_sid=sid)]
    for psid in owners:
        await sio.emit(
            "Shape.Options.Aura.Update", data, room=psid, namespace=GAME_NS,
        )
    for psid in game_state.get_sids(active_location=pr.active_location, skip_sid=sid):
        if psid in owners:
            continue
        if changed_visible:
            if aura.visible:
                await sio.emit(
                    "Shape.Options.Aura.Create",
                    {"shape": shape.uuid, **aura.as_dict()},
                    room=psid,
                    namespace=GAME_NS,
                )
            else:
                await sio.emit(
                    "Shape.Options.Aura.Remove",
                    {"shape": shape.uuid, "value": aura.uuid},
                    room=psid,
                    namespace=GAME_NS,
                )
        else:
            await sio.emit(
                "Shape.Options.Aura.Update", data, room=psid, namespace=GAME_NS,
            )
