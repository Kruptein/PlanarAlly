import json
from typing import Any, List, cast

from playhouse.shortcuts import update_model_from_dict
from typing_extensions import TypedDict

from ... import auth
from ...api.socket.constants import GAME_NS
from ...app import app, sio
from ...config import config
from ...logs import logger
from ...models import (
    Floor,
    Initiative,
    Layer,
    Location,
    LocationOptions,
    LocationUserOption,
    Marker,
    Note,
    PlayerRoom,
    Room,
    Shape,
)
from ...models.asset import Asset
from ...models.label import Label, LabelSelection
from ...models.role import Role
from ...state.game import game_state
from ..helpers import _send_game
from ..models.client import OptionalClientViewport
from ..models.client.gameboard import ClientGameboardSet
from ..models.location import (
    ApiLocationCore,
    LocationChange,
    LocationClone,
    LocationRename,
)
from ..models.location.settings import (
    ApiOptionalLocationOptions,
    LocationOptionsSet,
    LocationSettingsSet,
)
from ..models.players.info import PlayerInfoCore, PlayersInfoSet
from ..models.players.options import PlayerOptionsSet
from ..models.room.info import RoomInfoSet
from ..models.shape import ApiShape


# DATA CLASSES FOR TYPE CHECKING
class LocationOptionKeys(TypedDict, total=False):
    unit_size: float
    unit_size_unit: str
    use_grid: bool
    grid_type: str
    full_fow: bool
    fow_opacity: float
    fow_los: bool
    vision_mode: str
    vision_min_range: float
    vision_max_range: float
    spawn_locations: str


@sio.on("Location.Load", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def _load_location(sid: str):
    pr: PlayerRoom = game_state.get(sid)

    await load_location(sid, pr.active_location, complete=True)


@auth.login_required(app, sio, "game")
async def load_location(sid: str, location: Location, *, complete=False):
    pr: PlayerRoom = game_state.get(sid)
    if pr.active_location != location:
        pr.active_location = location
        pr.save()

    IS_DM = pr.role == Role.DM

    player_data: list[PlayersInfoSet] = []
    current_player_index = -1
    for i, rp in enumerate(pr.room.players):
        if rp.player.id == pr.player.id:
            current_player_index = i

        player_info = PlayersInfoSet(
            core=PlayerInfoCore(
                id=rp.player.id,
                name=rp.player.name,
                location=rp.active_location.id,
                role=rp.role,
            )
        )

        if IS_DM or rp.player.id == pr.player.id:
            player_info.position = (
                LocationUserOption.get(
                    user=rp.player, location=rp.active_location
                ).as_pydantic(),
            )[0]

        if IS_DM:
            client_data: list[OptionalClientViewport] = []
            for client in game_state.get_sids(player=rp.player, room=pr.room):
                client_info = OptionalClientViewport(client=client)
                viewport = game_state.client_viewports.get(client)
                if viewport is not None:
                    client_info.viewport = viewport
                client_data.append(client_info)
            player_info.clients = client_data

        player_data.append(player_info)

    # 0. CLEAR

    if complete:
        await _send_game("CLEAR", None, room=sid)
    else:
        await _send_game("PARTIAL-CLEAR", None, room=sid)

    # 1. Load room info

    if complete:
        await _send_game(
            "Room.Info.Set",
            RoomInfoSet(
                name=pr.room.name,
                creator=pr.room.creator.name,
                invitationCode=str(pr.room.invitation_code),
                isLocked=pr.room.is_locked,
                publicName=config.get("General", "public_name", fallback=""),
            ),
            room=sid,
        )

    # 2. Load player info & options

    client_options = PlayerOptionsSet(
        colour_history=pr.player.colour_history,
        default_user_options=pr.player.default_options.as_pydantic(False),
    )

    if pr.user_options:
        client_options.room_user_options = pr.user_options.as_pydantic(True)

    await _send_game("Players.Info.Set", player_data, room=sid)
    await _send_game("Player.Options.Set", client_options, room=sid)

    # 3. Load location

    location_data = location.as_pydantic()

    await _send_game("Location.Set", location_data, room=sid)

    # 4. Load location settings

    default_options = pr.room.default_options.as_pydantic(False)
    location_settings = LocationSettingsSet(
        default=default_options,
        active=location_data.id,
        locations={},
    )
    if complete and IS_DM:
        location_settings.locations = {
            loc.id: ApiOptionalLocationOptions(spawn_locations="[]")
            if loc.options is None
            else loc.options.as_pydantic(True)
            for loc in pr.room.locations
        }
        await _send_game("Locations.Settings.Set", location_settings, room=sid)
    elif not IS_DM:
        loc = pr.active_location
        location_settings.locations = {
            loc.id: ApiOptionalLocationOptions(spawn_locations="[]")
            if loc.options is None
            else loc.options.as_pydantic(True)
        }
        await _send_game("Locations.Settings.Set", location_settings, room=sid)

    # 5. Load Board

    locations = [
        ApiLocationCore(id=loc.id, name=loc.name, archived=loc.archived)
        for loc in pr.room.locations.order_by(Location.index)
    ]
    await _send_game("Board.Locations.Set", locations, room=sid)

    floors = [floor for floor in location.floors.order_by(Floor.index)]

    player_position = player_data[current_player_index].position
    if player_position:
        if player_position.active_floor is not None:
            index = next(
                i
                for i, f in enumerate(floors)
                if f.name == player_position.active_floor
            )
            lower_floors = floors[index - 1 :: -1] if index > 0 else []
            higher_floors = floors[index + 1 :] if index < len(floors) else []
            floors = [floors[index], *lower_floors, *higher_floors]

    for floor in floors:
        await _send_game(
            "Board.Floor.Set", floor.as_pydantic(pr.player, cast(bool, IS_DM)), room=sid
        )

    # 6. Load Initiative

    initiative_data = Initiative.get_or_none(location=location)
    if initiative_data:
        await _send_game("Initiative.Set", initiative_data.as_pydantic(), room=sid)

    # 7. Load labels

    if complete:
        labels = Label.select().where(
            (Label.user == pr.player) | (Label.visible == True)  # noqa: E712
        )
        label_filters = LabelSelection.select().where(
            (LabelSelection.user == pr.player) & (LabelSelection.room == pr.room)
        )

        await _send_game(
            "Labels.Set", [label.as_pydantic() for label in labels], room=sid
        )
        await _send_game(
            "Labels.Filters.Set",
            [label_filter.label.uuid for label_filter in label_filters],
            room=sid,
        )

    # 8. Load Notes

    await _send_game(
        "Notes.Set",
        [
            note.as_pydantic()
            for note in Note.select().where(
                (Note.user == pr.player) & (Note.room == pr.room)
            )
        ],
        room=sid,
    )

    # 9. Load Markers

    await _send_game(
        "Markers.Set",
        [
            marker.as_string()
            for marker in Marker.select(Marker.shape_id).where(
                (Marker.user == pr.player) & (Marker.location == location)
            )
        ],
        room=sid,
    )

    # 10. Load Assets

    if complete:
        # todo: pydantic
        await _send_game(
            "Asset.List.Set", Asset.get_user_structure(pr.player), room=sid
        )

    # 11. Sync Gameboards

    for psid in game_state.get_sids(active_location=pr.active_location):
        if psid in game_state.client_gameboards:
            board_id = game_state.client_gameboards[psid]
            if IS_DM or sid == psid:
                await _send_game(
                    "Client.Gameboard.Set",
                    ClientGameboardSet(client=psid, boardId=board_id),
                    room=sid,
                )


@sio.on("Location.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_location(sid: str, raw_data: Any):
    data = LocationChange(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change location")
        return

    # Send an anouncement to show loading state
    for room_player in pr.room.players:
        if room_player.player.name not in data.users:
            continue

        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            await _send_game("Location.Change.Start", None, room=psid)

    new_location = Location.get_by_id(data.location)

    # First update DB for _all_ affected players
    for room_player in pr.room.players:
        if room_player.player.name not in data.users:
            continue

        room_player.active_location = new_location
        room_player.save()

    # Then send out updates
    for room_player in pr.room.players:
        if room_player.player.name not in data.users:
            continue

        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            try:
                sio.leave_room(
                    psid, room_player.active_location.get_path(), namespace=GAME_NS
                )
                sio.enter_room(psid, new_location.get_path(), namespace=GAME_NS)
            except KeyError:
                await game_state.remove_sid(psid)
                continue
            await load_location(psid, new_location)
            # We could send this to all users in the new location, BUT
            # loading times might vary and we don't want to snap people back when they already move around
            # And it's possible that there are already users on the new location
            # that don't want to be moved to this new position
            if data.position:
                await sio.emit(
                    "Position.Set",
                    data=data.position,
                    room=psid,
                    namespace=GAME_NS,
                )


@sio.on("Location.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_location_options(sid: str, raw_data: Any):
    data = LocationOptionsSet(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set a room option")
        return

    if data.location is None:
        options = pr.room.default_options
    else:
        loc = Location.get_by_id(data.location)
        if loc.options is None:
            loc.options = LocationOptions.create_empty()
            loc.save()
        options = loc.options

    update_model_from_dict(options, data.options.dict())
    options.save()

    if data.location is None:
        for sid in game_state.get_sids(skip_sid=sid, room=pr.room):
            await _send_game("Location.Options.Set", data, room=sid)
    else:
        await _send_game(
            "Location.Options.Set",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
        )


@sio.on("Location.New", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def add_new_location(sid: str, location: str):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to add a new location")
        return

    new_location = Location.create(
        room=pr.room, name=location, index=pr.room.locations.count()
    )
    new_location.create_floor()

    for psid in game_state.get_sids(
        player=pr.player, active_location=pr.active_location
    ):
        sio.leave_room(psid, pr.active_location.get_path(), namespace=GAME_NS)
        sio.enter_room(psid, new_location.get_path(), namespace=GAME_NS)
        await load_location(psid, new_location)
    pr.active_location = new_location
    pr.save()


@sio.on("Location.Clone", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def clone_location(sid: str, raw_data: Any):
    data = LocationClone(**raw_data)

    pr: PlayerRoom = game_state.get(sid)
    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to clone locations.")
        return
    try:
        room = Room.select().where(
            (Room.name == data.room) & (Room.creator == pr.player)
        )[0]
    except IndexError:
        logger.warning(f"Destination room {data.room} not found.")
        return

    src_location = Location.get_by_id(data.location)
    new_location = Location.create(
        room=room, name=src_location.name, index=room.locations.count()
    )

    new_groups = {}

    floor_map = {}

    for prev_floor in src_location.floors.order_by(Floor.index):
        new_floor = new_location.create_floor(prev_floor.name)
        floor_map[prev_floor.name] = {}
        for prev_layer in prev_floor.layers:
            new_layer = new_floor.layers.where(Layer.name == prev_layer.name).get()
            floor_map[prev_floor.name][prev_layer.name] = new_layer.id
            for src_shape in prev_layer.shapes:
                new_group = None
                if src_shape.group:
                    group_id = src_shape.group.uuid
                    if group_id not in new_groups:
                        new_groups[group_id] = src_shape.group.make_copy()
                    new_group = new_groups[group_id]

                src_shape.make_copy(new_layer, new_group)

    for luo in src_location.user_options:
        lduo = luo.as_pydantic().dict()
        lduo["location"] = new_location
        lduo["user"] = luo.user
        if lduo["active_layer"]:
            lduo["active_layer"] = floor_map[lduo["active_floor"]][lduo["active_layer"]]
            del lduo["active_floor"]

        q = LocationUserOption.select().where(
            (LocationUserOption.location == new_location)
            & (LocationUserOption.user == luo.user)
        )
        if q.exists():
            q[0].update(**lduo).where(
                (LocationUserOption.location == new_location)
                & (LocationUserOption.user == luo.user)
            ).execute()
        else:
            LocationUserOption.create(**lduo)

    if room == pr.room:
        for psid in game_state.get_sids(
            player=pr.player, active_location=pr.active_location
        ):
            sio.leave_room(psid, pr.active_location.get_path(), namespace=GAME_NS)
            sio.enter_room(psid, new_location.get_path(), namespace=GAME_NS)
            await load_location(psid, new_location)
        pr.active_location = new_location
        pr.save()


@sio.on("Locations.Order.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_locations_order(sid: str, locations: List[int]):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to reorder locations.")
        return

    for i, idx in enumerate(locations):
        loc: Location = Location.get_by_id(idx)
        loc.index = i + 1
        loc.save()

    for player_room in pr.room.players:
        if player_room.role != Role.DM:
            continue
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await _send_game("Locations.Order.Set", locations, room=psid)


@sio.on("Location.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_location(sid: str, raw_data: Any):
    data = LocationRename(**raw_data)

    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a location.")
        return

    location = Location.get_by_id(data.location)
    location.name = data.name
    location.save()

    for player_room in pr.room.players:
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await _send_game("Location.Rename", data, room=psid)


@sio.on("Location.Delete", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def delete_location(sid: str, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a location.")
        return

    location = Location.get_by_id(location_id)

    if location.players.count() > 0:
        logger.error(
            "A location was attempted to be removed that still has players! This has been prevented"
        )
        return

    location.delete_instance(recursive=True)


@sio.on("Location.Archive", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def archive_location(sid: str, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to archive a location.")
        return

    location = Location.get_by_id(location_id)
    location.archived = True
    location.save()

    for player_room in pr.room.players:
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await _send_game("Location.Archive", location_id, room=psid)


@sio.on("Location.Unarchive", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def unarchive_location(sid: str, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to unarchive a location.")
        return

    location = Location.get_by_id(location_id)
    location.archived = False
    location.save()

    for player_room in pr.room.players:
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await _send_game("Location.Unarchive", location_id, room=psid)


@sio.on("Location.Spawn.Info.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_location_spawn_info(sid: str, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to retrieve spawn locations.")
        return

    data: list[ApiShape] = []

    try:
        location = Location.get_by_id(location_id)
        if location.options is not None:
            for spawn in json.loads(location.options.spawn_locations):
                try:
                    shape = Shape.get_by_id(spawn)
                except Shape.DoesNotExist:
                    pass
                else:
                    data.append(shape.as_pydantic(pr.player, True))
    except:
        logger.exception("Could not load spawn locations")

    await _send_game("Location.Spawn.Info", data, room=sid)
