from typing import Any, Dict
from typing_extensions import TypedDict

import auth

from api.socket.constants import GAME_NS
from app import app, sio
from data_types.location import LocationOptions
from models import Floor, Layer, LocationUserOption, PlayerRoom
from models.db import db
from models.role import Role
from models.user import UserOptions
from state.game import game_state


# DATA CLASSES FOR TYPE CHECKING
class MoveClientData(TypedDict):
    player: int
    data: LocationOptions


class ClientOptions(TypedDict, total=False):
    grid_colour: str
    fow_colour: str
    ruler_colour: str

    invert_alt: bool
    disable_scroll_to_zoom: bool

    use_high_dpi: bool
    grid_size: int
    use_as_physical_board: bool
    mini_size: int
    ppi: int

    initiative_camera_lock: bool
    initiative_vision_lock: bool
    initiative_effect_visibility: int


@sio.on("Client.Options.Default.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_default_options(sid: str, data: ClientOptions):
    pr: PlayerRoom = game_state.get(sid)

    UserOptions.update(**data).where(
        UserOptions.id == pr.player.default_options
    ).execute()


@sio.on("Client.Options.Room.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_room_options(sid: str, data: ClientOptions):
    pr: PlayerRoom = game_state.get(sid)

    with db.atomic():
        if pr.user_options is None:
            pr.user_options = UserOptions.create_empty()
            pr.save()

        UserOptions.update(**data).where(UserOptions.id == pr.user_options).execute()


async def update_client_location(
    player: int, room: int, sid: str, data: LocationOptions
):
    pr = PlayerRoom.get(player=player, room=room)

    LocationUserOption.update(
        pan_x=data["pan_x"],
        pan_y=data["pan_y"],
        zoom_display=data["zoom_display"],
    ).where(
        (LocationUserOption.location == pr.active_location)
        & (LocationUserOption.user == pr.player)
    ).execute()

    if pr.role != Role.DM:
        for p_sid, p_player in game_state.get_t(skip_sid=sid):
            if p_player.role == Role.DM or p_player.player.id == player:
                await sio.emit(
                    "Client.Move",
                    {"player": pr.player.id, **data},
                    room=p_sid,
                    namespace=GAME_NS,
                )


@sio.on("Client.Options.Location.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_location_options(sid: str, data: LocationOptions):
    pr: PlayerRoom = game_state.get(sid)
    game_state.client_locations[sid] = data

    await update_client_location(pr.player.id, pr.room.id, sid, data)


@sio.on("Client.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_client(sid: str, data: MoveClientData):
    pr: PlayerRoom = game_state.get(sid)

    await update_client_location(data["player"], pr.room.id, sid, data["data"])


@sio.on("Client.ActiveLayer.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_layer(sid: str, data: Dict[str, Any]):
    pr: PlayerRoom = game_state.get(sid)

    try:
        floor = pr.active_location.floors.where(Floor.name == data["floor"])[0]
        layer = floor.layers.where(Layer.name == data["layer"])[0]
    except IndexError:
        pass
    else:
        luo = LocationUserOption.get(user=pr.player, location=pr.active_location)
        luo.active_layer = layer
        luo.save()
