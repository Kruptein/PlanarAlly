from typing import Any, cast

from .... import auth
from ....api.helpers import _send_game
from ....app import app, sio
from ....models import PlayerRoom
from ....models.shape import CompositeShapeAssociation, ToggleComposite
from ....state.game import game_state
from ...models.togglecomposite import ToggleCompositeNewVariant, ToggleCompositeVariant
from ..constants import GAME_NS
from .utils import get_shape_or_none


@sio.on("ToggleComposite.Variants.Active.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_toggle_composite_active_variant(sid: str, raw_data: Any):
    data = ToggleCompositeVariant(**raw_data)
    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shape, "ToggleComposite.Variants.Active.Set")
    if shape is None:
        return

    composite = cast(ToggleComposite, shape.subtype)

    composite.active_variant = data.variant
    composite.save()

    await _send_game(
        "ToggleComposite.Variants.Active.Set",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


VARIANT_ADD = "ToggleComposite.Variants.Add"


@sio.on(VARIANT_ADD, namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_toggle_composite_variant(sid: str, raw_data: Any):
    data = ToggleCompositeNewVariant(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    parent = get_shape_or_none(pr, data.shape, VARIANT_ADD)
    variant = get_shape_or_none(pr, data.variant, VARIANT_ADD)
    if parent is None or variant is None:
        return

    CompositeShapeAssociation.create(parent=parent, variant=variant, name=data.name)

    await _send_game(
        VARIANT_ADD, data, room=pr.active_location.get_path(), skip_sid=sid
    )


@sio.on("ToggleComposite.Variants.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_toggle_composite_variant(sid: str, raw_data: Any):
    data = ToggleCompositeNewVariant(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    composite = CompositeShapeAssociation.get(parent=data.shape, variant=data.variant)
    composite.name = data.name
    composite.save()

    await _send_game(
        "ToggleComposite.Variants.Rename",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )


@sio.on("ToggleComposite.Variants.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_toggle_composite_variant(sid: str, raw_data: Any):
    data = ToggleCompositeVariant(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    composite = CompositeShapeAssociation.get(parent=data.shape, variant=data.variant)
    composite.delete_instance(True)

    await _send_game(
        "ToggleComposite.Variants.Remove",
        data,
        skip_sid=sid,
        room=pr.active_location.get_path(),
    )
