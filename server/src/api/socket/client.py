from typing import Any, Dict, Optional
from typing_extensions import TypedDict

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...data_types.client import Viewport
from ...data_types.location import LocationOptions
from ...models import Floor, Layer, LocationUserOption, PlayerRoom
from ...models.db import db
from ...models.role import Role
from ...models.user import UserOptions
from ...state.game import game_state


# DATA CLASSES FOR TYPE CHECKING
class MoveClientData(TypedDict):
    client: str
    data: LocationOptions


class TempLocationOptions(TypedDict):
    temp: bool
    options: LocationOptions


class OffsetMessage(TypedDict):
    client: str
    x: Optional[int]
    y: Optional[int]


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

    UserOptions.update({k: None for k in data}).where(
        UserOptions.id == pr.user_options
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
    sid: str, target_client: str, data: TempLocationOptions
):
    pr = game_state.get(target_client)

    if not data["temp"]:
        LocationUserOption.update(
            pan_x=data["options"]["pan_x"],
            pan_y=data["options"]["pan_y"],
            zoom_display=data["options"]["zoom_display"],
        ).where(
            (LocationUserOption.location == pr.active_location)
            & (LocationUserOption.user == pr.player)
        ).execute()

    for p_sid, p_player in game_state.get_t(skip_sid=sid):
        is_dm = p_player.role == Role.DM
        is_in_active_location = p_player.active_location == pr.active_location
        if (is_dm and is_in_active_location) or p_player.player.id == pr.player.id:
            await sio.emit(
                "Client.Move",
                {
                    "player": pr.player.id,
                    "client": sid,
                    **data["options"],
                },
                room=p_sid,
                namespace=GAME_NS,
            )


@sio.on("Client.Options.Location.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_client_location_options(sid: str, data: TempLocationOptions):
    await update_client_location(sid, sid, data)


@sio.on("Client.Move", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def move_client(sid: str, data: MoveClientData):
    await update_client_location(
        sid, data["client"], {"temp": False, "options": data["data"]}
    )


@sio.on("Client.Viewport.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_viewport(sid: str, data: Viewport):
    pr = game_state.get(sid)

    game_state.client_viewports[sid] = data

    await sio.emit(
        "Client.Viewport.Set",
        {"viewport": data, "client": sid},
        room=pr.room.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )


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


@sio.on("Client.Gameboard.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_gameboard(sid: str, board_id: str):
    pr = game_state.get(sid)

    game_state.client_gameboards[sid] = board_id

    for psid, ppr in game_state.get_t(skip_sid=sid, room=pr.room):
        if ppr.role == Role.DM:
            await sio.emit(
                "Client.Gameboard.Set",
                {
                    "client": sid,
                    "boardId": board_id,
                },
                room=psid,
                namespace=GAME_NS,
            )


@sio.on("Client.Offset.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_offset(sid: str, data: OffsetMessage):
    pr = game_state.get(sid)

    viewport = game_state.client_viewports.get(data["client"])

    if viewport is not None:
        viewport["offset_x"] = data.get("x", viewport.get("offset_x", None))
        viewport["offset_y"] = data.get("y", viewport.get("offset_y", None))
    else:
        print("Unknown client viewport")

    await sio.emit(
        "Client.Offset.Set",
        data,
        room=pr.active_location.get_path(),
        skip_sid=sid,
        namespace=GAME_NS,
    )
