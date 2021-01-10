from typing import Any, Dict

from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import Floor, Layer, LocationUserOption, PlayerRoom
from models.db import db
from models.role import Role
from state.game import game_state
from utils import logger

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
    location_options: LocationOptions


class BringPlayersData(TypedDict):
    floor: str
    x: int
    y: int
    zoom: int


@sio.on("Client.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_client(sid: str, data: ClientOptions):
    pr: PlayerRoom = game_state.get(sid)

    with db.atomic():
        for option, value in data.items():
            if option != "location_options":
                setattr(pr.player, option, value)
        pr.player.save()

    if "location_options" in data:
        LocationUserOption.update(
            pan_x=data["location_options"]["pan_x"],
            pan_y=data["location_options"]["pan_y"],
            zoom_factor=data["location_options"]["zoom_factor"],
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
