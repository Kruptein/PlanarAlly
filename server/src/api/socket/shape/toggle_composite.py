from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from api.socket.shape.utils import get_shape_or_none
from app import app, sio
from models import PlayerRoom
from models.shape import CompositeShapeAssociation, ToggleComposite
from state.game import game_state


class VariantMessage(TypedDict):
    shape: str
    variant: str


class NewVariantMessage(VariantMessage):
    name: str


@sio.on("ToggleComposite.Variants.Active.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_toggle_composite_active_variant(sid: str, data: VariantMessage):
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data["shape"], "ToggleComposite.Variants.Active.Set")
    if shape is None:
        return

    composite: ToggleComposite = shape.subtype

    composite.active_variant = data["variant"]
    composite.save()

    await sio.emit(
        "ToggleComposite.Variants.Active.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("ToggleComposite.Variants.Add", namespace=GAME_NS)
@auth.login_required(app, sio)
async def add_toggle_composite_variant(sid: str, data: NewVariantMessage):
    pr: PlayerRoom = game_state.get(sid)

    parent = get_shape_or_none(pr, data["shape"], "ToggleComposite.Variants.Add")
    variant = get_shape_or_none(pr, data["variant"], "ToggleComposite.Variants.Add")
    if parent is None or variant is None:
        return

    CompositeShapeAssociation.create(parent=parent, variant=variant, name=data["name"])

    await sio.emit(
        "ToggleComposite.Variants.Add",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("ToggleComposite.Variants.Rename", namespace=GAME_NS)
@auth.login_required(app, sio)
async def rename_toggle_composite_variant(sid: str, data: NewVariantMessage):
    pr: PlayerRoom = game_state.get(sid)

    composite = CompositeShapeAssociation.get(
        parent=data["shape"], variant=data["variant"]
    )
    composite.name = data["name"]
    composite.save()

    await sio.emit(
        "ToggleComposite.Variants.Rename",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )


@sio.on("ToggleComposite.Variants.Remove", namespace=GAME_NS)
@auth.login_required(app, sio)
async def remove_toggle_composite_variant(sid: str, data: VariantMessage):
    pr: PlayerRoom = game_state.get(sid)

    composite = CompositeShapeAssociation.get(
        parent=data["shape"], variant=data["variant"]
    )
    composite.delete_instance(True)

    await sio.emit(
        "ToggleComposite.Variants.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
        namespace=GAME_NS,
    )
