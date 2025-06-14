from typing import Any

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...db.db import db
from ...db.models.floor import Floor
from ...db.models.layer import Layer
from ...db.models.location_user_option import LocationUserOption
from ...db.models.player_room import PlayerRoom
from ...db.models.user_options import UserOptions
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.client import (
    ClientMove,
    ClientPosition,
    ClientViewport,
    TempClientPosition,
    Viewport,
)
from ..models.client.activeLayer import ClientActiveLayerSet
from ..models.client.offset import ClientOffsetSet


@sio.on("Client.Options.Default.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_default_options(sid: str, raw_data: dict[str, Any]):
    # Don't use the full pydantic model as the returned type is actually Partial<...>

    pr: PlayerRoom = game_state.get(sid)

    UserOptions.update(**raw_data).where(UserOptions.id == pr.player.default_options).execute()

    UserOptions.update({k: None for k in raw_data}).where(UserOptions.id == pr.user_options).execute()


@sio.on("Client.Options.Room.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_room_options(sid: str, raw_data: dict[str, Any]):
    # Don't use the full pydantic model as the returned type is actually Partial<...>

    pr: PlayerRoom = game_state.get(sid)

    with db.atomic():
        if pr.user_options is None:
            pr.user_options = UserOptions.create_empty()
            pr.save()

        UserOptions.update(**raw_data).where(UserOptions.id == pr.user_options).execute()


async def update_client_location(sid: str, target_client: str, data: TempClientPosition):
    pr = game_state.get(target_client)

    if not data.temp:
        LocationUserOption.update(
            pan_x=data.position.pan_x,
            pan_y=data.position.pan_y,
            zoom_display=data.position.zoom_display,
        ).where((LocationUserOption.location == pr.active_location) & (LocationUserOption.user == pr.player)).execute()

    for p_sid, p_player in game_state.get_t(skip_sid=sid):
        is_dm = p_player.role == Role.DM
        is_in_active_location = p_player.active_location == pr.active_location
        if (is_dm and is_in_active_location) or p_player.player.id == pr.player.id:
            await _send_game(
                "Client.Move",
                ClientMove(
                    client=sid,
                    position=ClientPosition(
                        pan_x=data.position.pan_x,
                        pan_y=data.position.pan_y,
                        zoom_display=data.position.zoom_display,
                    ),
                ),
                room=p_sid,
            )


@sio.on("Client.Options.Location.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_location_options(sid: str, raw_data: Any):
    data = TempClientPosition(**raw_data)
    await update_client_location(sid, sid, data)


@sio.on("Client.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_client(sid: str, raw_data: Any):
    data = ClientMove(**raw_data)
    await update_client_location(sid, data.client, TempClientPosition(temp=False, position=data.position))


@sio.on("Client.Viewport.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_viewport(sid: str, raw_data: Any):
    viewport = Viewport(**raw_data)

    pr = game_state.get(sid)

    game_state.client_viewports[sid] = viewport

    await _send_game(
        "Client.Viewport.Set",
        ClientViewport(viewport=viewport, client=sid),
        room=pr.room.get_path(),
        skip_sid=sid,
    )


@sio.on("Client.ActiveLayer.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_layer(sid: str, raw_data: Any):
    data = ClientActiveLayerSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    try:
        floor = pr.active_location.floors.where(Floor.name == data.floor)[0]
        layer = floor.layers.where(Layer.name == data.layer)[0]
    except IndexError:
        pass
    else:
        luo = LocationUserOption.get(user=pr.player, location=pr.active_location)
        luo.active_layer = layer
        luo.save()


@sio.on("Client.Offset.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_offset(sid: str, raw_data: Any):
    data = ClientOffsetSet(**raw_data)

    pr = game_state.get(sid)

    viewport = game_state.client_viewports.get(data.client)

    if viewport is not None:
        viewport.offset_x = data.x or viewport.offset_x or None
        viewport.offset_y = data.y or viewport.offset_y or None
    else:
        print("Unknown client viewport")

    await _send_game(
        "Client.Offset.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
    )
