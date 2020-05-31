from typing import Any, Dict

import auth
from api.socket.constants import GAME_NS
from app import app, logger, sio
from models import Floor, Layer, LocationUserOption, PlayerRoom
from models.db import db
from models.role import Role
from state.game import game_state

from . import (
    asset_manager,
    connection,
    floor,
    initiative,
    label,
    location,
    marker,
    note,
    room,
    shape,
)


@sio.on("Client.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_client(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    with db.atomic():
        for option in [
            ("gridColour", "grid_colour"),
            ("fowColour", "fow_colour"),
            ("rulerColour", "ruler_colour"),
            ("invertAlt", "invert_alt"),
        ]:
            if option[0] in data:
                setattr(pr.player, option[1], data[option[0]])
        pr.player.save()
    if "locationOptions" in data:
        LocationUserOption.update(
            pan_x=data["locationOptions"]["panX"],
            pan_y=data["locationOptions"]["panY"],
            zoom_factor=data["locationOptions"]["zoomFactor"],
        ).where(
            (LocationUserOption.location == pr.active_location)
            & (LocationUserOption.user == pr.player)
        ).execute()


@sio.on("Client.ActiveLayer.Set", namespace=GAME_NS)
@auth.login_required(app, sio)
async def set_layer(sid: int, data: Dict[str, Any]):
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
async def bring_players(sid: int, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    await sio.emit(
        "Position.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )
