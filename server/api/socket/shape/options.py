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


class TrackerData(TypedDict, total=False):
    uuid: str
    visible: bool
    shape_id: str
    name: str
    value: int
    maxvalue: int


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
    # old_trackers = {tracker.uuid for tracker in shape.trackers}
    # new_trackers = {tracker["uuid"] for tracker in data["shape"]["trackers"]}
    # for tracker_id in old_trackers | new_trackers:
    #     remove = tracker_id in old_trackers - new_trackers
    #     if not remove:
    #         tracker = next(
    #             tr for tr in data["shape"]["trackers"] if tr["uuid"] == tracker_id
    #         )
    #         reduced = reduce_data_to_model(Tracker, tracker)
    #         reduced["shape"] = shape
    #     if tracker_id in new_trackers - old_trackers:
    #         Tracker.create(**reduced)
    #         continue
    #     tracker_db = Tracker.get(uuid=tracker_id)
    #     if remove:
    #         tracker_db.delete_instance(True)
    #     else:
    #         update_model_from_dict(tracker_db, reduced)
    #         tracker_db.save()

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


@sio.on("Shape.Options.Aura.Vision.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_aura_vision(sid: str, data: ShapeAuraSetBooleanValue):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "Aura.Remove")
    if shape is None:
        return

    aura = Aura.get_by_id(data["aura"])
    aura.vision_source = data["value"]
    aura.save()

    await sio.emit(
        "Shape.Options.Aura.Vision.Set",
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


@sio.on("Shape.Options.Tracker.UpdateOrCreate", namespace=GAME_NS)
@auth.login_required(app, sio)
async def update_or_create_tracker(sid: str, data: TrackerData):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape_id"], "Tracker.UpdateOrCreate")
    if shape is None:
        return

    tracker: Tracker
    try:
        tracker = Tracker.get_by_id(data["value"])
    except Tracker.DoesNotExist:
        model = reduce_data_to_model(Tracker, data)
        tracker = Tracker.create(**model)
    else:
        update_model_from_dict(tracker, data)
    tracker.save()

    await sio.emit(
        "Shape.Options.Tracker.UpdateOrCreate",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )
