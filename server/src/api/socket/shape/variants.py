from typing import Any

from pydantic import TypeAdapter

from .... import auth
from ....api.helpers import _send_game
from ....api.models.shape.variants import ApiVariantIdentifier, ApiAddVariant, ApiCreateVariant
from ....api.socket.constants import GAME_NS
from ....api.socket.shape.utils import get_owner_sids, get_shape_or_none
from ....app import app, sio
from ....db.models.asset_rect_variant import AssetRectVariant
from ....db.models.player_room import PlayerRoom
from ....logs import logger
from ....state.game import game_state


@sio.on("Shape.Variants.Create", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def create_shape_variant(sid: str, raw_data: Any):
    data = TypeAdapter(ApiCreateVariant).validate_python(raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.Variants.Create")
    if shape is None:
        logger.error(f"Attempt to create variant for unknown shape by {pr.player.name} [{data.shapeId}]")
        return

    new_variant = AssetRectVariant.create(
        shape=shape.uuid,
        name=data.name,
        asset=data.assetId,
        height=data.height,
        width=data.width,
    )

    for psid in get_owner_sids(pr, shape):
        await _send_game(
            "Shape.Variants.Add",
            ApiAddVariant(**raw_data, assetHash=new_variant.asset.file_hash, id=new_variant.id),
            room=psid,
        )


@sio.on("Shape.Variants.Update", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def update_shape_variant(sid: str, raw_data: Any):
    data = TypeAdapter(ApiAddVariant).validate_python(raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.Variants.Update")
    if shape is None:
        logger.error(f"Attempt to update variant for unknown shape by {pr.player.name} [{data.shapeId}]")
        return

    variant = AssetRectVariant.get_or_none(id=data.id)
    if variant is None:
        logger.error(f"Attempt to update unknown variant for shape by {pr.player.name} [{data.shapeId}] [{data.id}]")
        return

    variant.name = data.name
    variant.asset_id = data.assetId
    variant.width = data.width
    variant.height = data.height
    variant.save()

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.Variants.Update",
            raw_data,
            room=psid,
        )


@sio.on("Shape.Variants.Remove", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def remove_shape_variant(sid: str, raw_data: Any):
    data = TypeAdapter(ApiVariantIdentifier).validate_python(raw_data)

    pr: PlayerRoom = game_state.get(sid)

    shape = get_shape_or_none(pr, data.shapeId, "Shape.Variants.Remove")
    if shape is None:
        logger.error(f"Attempt to remove variant for unknown shape by {pr.player.name} [{data.shapeId}]")
        return

    variant = AssetRectVariant.get_or_none(id=data.variantId)
    if variant is None:
        logger.error(
            f"Attempt to remove unknown variant for shape by {pr.player.name} [{data.shapeId}] [{data.variantId}]"
        )
        return

    variant.delete_instance()

    for psid in get_owner_sids(pr, shape, skip_sid=sid):
        await _send_game(
            "Shape.Variants.Remove",
            raw_data,
            room=psid,
        )
