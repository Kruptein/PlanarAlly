from typing import Any, Dict

from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import Floor, Layer, LocationUserOption, PlayerRoom
from models.db import db
from models.user import UserOptions
from state.game import game_state

from . import (
    asset,
    asset_manager,
    connection,
    floor,
    groups,
    initiative,
    label,
    location,
    marker,
    note,
    room,
    shape,
)

# DATA CLASSES FOR TYPE CHECKING
class LocationOptions(TypedDict):
    pan_x: int
    pan_y: int
    zoom_factor: int


class ClientOptions(TypedDict, total=False):
    grid_colour: str
    fow_colour: str
    ruler_colour: str
    invert_alt: bool
    grid_size: int
    disable_scroll_to_zoom: bool


class BringPlayersData(TypedDict):
    floor: str
    x: int
    y: int
    zoom: int


@sio.on("Client.Options.Default.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_client_default_options(sid: str, data: ClientOptions):
    pr: PlayerRoom = game_state.get(sid)

    UserOptions.update(**data).where(
        UserOptions.id == pr.player.default_options
    ).execute()


@sio.on("Client.Options.Room.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_client_room_options(sid: str, data: ClientOptions):
    pr: PlayerRoom = game_state.get(sid)

    with db.atomic():
        if pr.user_options is None:
            pr.user_options = UserOptions.create_empty()
            pr.save()

        UserOptions.update(**data).where(UserOptions.id == pr.user_options).execute()


@sio.on("Client.Options.Location.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_client_location_options(sid: str, data: LocationOptions):
    pr: PlayerRoom = game_state.get(sid)

    LocationUserOption.update(
        pan_x=data["pan_x"],
        pan_y=data["pan_y"],
        zoom_factor=data["zoom_factor"],
    ).where(
        (LocationUserOption.location == pr.active_location)
        & (LocationUserOption.user == pr.player)
    ).execute()


@sio.on("Client.ActiveLayer.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_layer(sid: str, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    try:
        floor = pr.active_location.floors.select().where(Floor.name == data["floor"])[0]
        layer = floor.layers.select().where(Layer.name == data["layer"])[0]
    except IndexError:
        pass
    else:
        luo = LocationUserOption.get(user=pr.player, location=pr.active_location)
        luo.active_layer = layer
        luo.save()


@sio.on("Players.Bring", namespace=GAME_NS)
@auth.login_required(app, sio)
async def bring_players(sid: str, data: BringPlayersData):
    pr: PlayerRoom = game_state.get(sid)

    await sio.emit(
        "Position.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )
