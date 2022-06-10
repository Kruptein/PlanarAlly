import json
from typing import List, Union, cast

from playhouse.shortcuts import update_model_from_dict
from typing_extensions import TypedDict

import auth
from api.socket.constants import GAME_NS
from app import app, sio
from models import (
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
from models.asset import Asset
from models.label import Label, LabelSelection
from models.role import Role
from state.game import game_state
from logs import logger

from config import config


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


class LocationOptionsData(TypedDict):
    options: LocationOptionKeys
    location: Union[int, None]


class PositionTuple(TypedDict):
    x: int
    y: int


class LocationChangeData(TypedDict):
    location: int
    users: List[str]
    position: PositionTuple


class LocationRenameData(TypedDict):
    location: int
    name: str


class LocationCloneData(TypedDict):
    location: int
    room: str


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

    # 0. CLEAR

    await sio.emit("CLEAR", room=sid, namespace=GAME_NS)

    # 1. Load client options

    client_options = pr.player.as_dict()
    client_options["location_user_options"] = LocationUserOption.get(
        user=pr.player, location=location
    ).as_dict()
    client_options["default_user_options"] = pr.player.default_options.as_dict()

    if pr.user_options:
        client_options["room_user_options"] = pr.user_options.as_dict()

    await sio.emit("Client.Options.Set", client_options, room=sid, namespace=GAME_NS)

    # 2. Load room info

    if complete:
        await sio.emit(
            "Room.Info.Set",
            {
                "name": pr.room.name,
                "creator": pr.room.creator.name,
                "invitationCode": str(pr.room.invitation_code),
                "isLocked": pr.room.is_locked,
                "default_options": pr.room.default_options.as_dict(),
                "players": [
                    {
                        "id": rp.player.id,
                        "name": rp.player.name,
                        "location": rp.active_location.id,
                        "role": rp.role,
                    }
                    for rp in pr.room.players
                ],
                "publicName": config.get("General", "public_name", fallback=""),
            },
            room=sid,
            namespace=GAME_NS,
        )

    # 3. Load location

    await sio.emit("Location.Set", location.as_dict(), room=sid, namespace=GAME_NS)

    # 4. Load all location settings (DM)

    if complete and pr.role == Role.DM:
        await sio.emit(
            "Locations.Settings.Set",
            {
                l.id: {} if l.options is None else l.options.as_dict()
                for l in pr.room.locations
            },
            room=sid,
            namespace=GAME_NS,
        )

    # 5. Load Board

    locations = [
        {"id": l.id, "name": l.name, "archived": l.archived}
        for l in pr.room.locations.order_by(Location.index)
    ]
    await sio.emit("Board.Locations.Set", locations, room=sid, namespace=GAME_NS)

    floors = [floor for floor in location.floors.order_by(Floor.index)]

    if "active_floor" in client_options["location_user_options"]:
        index = next(
            i
            for i, f in enumerate(floors)
            if f.name == client_options["location_user_options"]["active_floor"]
        )
        lower_floors = floors[index - 1 :: -1] if index > 0 else []
        higher_floors = floors[index + 1 :] if index < len(floors) else []
        floors = [floors[index], *lower_floors, *higher_floors]

    for floor in floors:
        await sio.emit(
            "Board.Floor.Set",
            floor.as_dict(pr.player, cast(bool, pr.role == Role.DM)),
            room=sid,
            namespace=GAME_NS,
        )

    # 6. Load Initiative

    location_data = Initiative.get_or_none(location=location)
    if location_data:
        await sio.emit(
            "Initiative.Set", location_data.as_dict(), room=sid, namespace=GAME_NS
        )

    # 7. Load labels

    if complete:
        labels = Label.select().where(
            (Label.user == pr.player) | (Label.visible == True)
        )
        label_filters = LabelSelection.select().where(
            (LabelSelection.user == pr.player) & (LabelSelection.room == pr.room)
        )

        await sio.emit(
            "Labels.Set",
            [l.as_dict() for l in labels],
            room=sid,
            namespace=GAME_NS,
        )
        await sio.emit(
            "Labels.Filters.Set",
            [l.label.uuid for l in label_filters],
            room=sid,
            namespace=GAME_NS,
        )

    # 8. Load Notes

    await sio.emit(
        "Notes.Set",
        [
            note.as_dict()
            for note in Note.select().where(
                (Note.user == pr.player) & (Note.room == pr.room)
            )
        ],
        room=sid,
        namespace=GAME_NS,
    )

    # 9. Load Markers

    await sio.emit(
        "Markers.Set",
        [
            marker.as_string()
            for marker in Marker.select(Marker.shape_id).where(
                (Marker.user == pr.player) & (Marker.location == location)
            )
        ],
        room=sid,
        namespace=GAME_NS,
    )

    # 10. Load Assets

    if complete:
        await sio.emit(
            "Asset.List.Set",
            Asset.get_user_structure(pr.player),
            room=sid,
            namespace=GAME_NS,
        )

    # 11. Load client positions

    if pr.role == Role.DM:
        for psid, player in game_state.get_users(
            skip_sid=sid, active_location=pr.active_location
        ):
            if psid not in game_state.client_locations:
                continue
            data = game_state.client_locations[psid]
            await sio.emit(
                "Client.Move",
                {"player": player.id, **data},
                room=sid,
                namespace=GAME_NS,
            )


@sio.on("Location.Change", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def change_location(sid: str, data: LocationChangeData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to change location")
        return

    # Send an anouncement to show loading state
    for room_player in pr.room.players:
        if room_player.player.name not in data["users"]:
            continue

        for psid in game_state.get_sids(player=room_player.player, room=pr.room):
            await sio.emit("Location.Change.Start", room=psid, namespace=GAME_NS)

    new_location = Location.get_by_id(data["location"])

    for room_player in pr.room.players:
        if room_player.player.name not in data["users"]:
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
            # And it's possible that there are already users on the new location that don't want to be moved to this new position
            if "position" in data:
                await sio.emit(
                    "Position.Set",
                    data=data["position"],
                    room=psid,
                    namespace=GAME_NS,
                )
        room_player.active_location = new_location
        room_player.save()


@sio.on("Location.Options.Set", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def set_location_options(sid: str, data: LocationOptionsData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to set a room option")
        return

    if data.get("location", None) is None:
        options = pr.room.default_options
    else:
        loc = Location.get_by_id(data["location"])
        if loc.options is None:
            loc.options = LocationOptions.create(
                unit_size=None,
                unit_size_unit=None,
                grid_type=None,
                use_grid=None,
                full_fow=None,
                fow_opacity=None,
                fow_los=None,
                vision_mode=None,
                vision_min_range=None,
                vision_max_range=None,
            )
            loc.save()
        options = loc.options

    update_model_from_dict(options, data["options"])
    options.save()

    if data.get("location", None) is None:
        for sid in game_state.get_sids(skip_sid=sid, room=pr.room):
            await sio.emit("Location.Options.Set", data, room=sid, namespace=GAME_NS)
    else:
        await sio.emit(
            "Location.Options.Set",
            data,
            room=pr.active_location.get_path(),
            skip_sid=sid,
            namespace=GAME_NS,
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
async def clone_location(sid: str, data: LocationCloneData):
    pr: PlayerRoom = game_state.get(sid)
    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to clone locations.")
        return
    try:
        room = Room.select().where(
            (Room.name == data["room"]) & (Room.creator == pr.player)
        )[0]
    except IndexError:
        logger.warning(f"Destination room {data['room']} not found.")
        return

    src_location = Location.get_by_id(data["location"])
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
        lduo = luo.as_dict()
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
        l: Location = Location.get_by_id(idx)
        l.index = i + 1
        l.save()

    for player_room in pr.room.players:
        if player_room.role != Role.DM:
            continue
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await sio.emit(
                "Locations.Order.Set", locations, room=psid, namespace=GAME_NS
            )


@sio.on("Location.Rename", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def rename_location(sid: str, data: LocationRenameData):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to rename a location.")
        return

    location = Location.get_by_id(data["location"])
    location.name = data["name"]
    location.save()

    for player_room in pr.room.players:
        for psid in game_state.get_sids(skip_sid=sid, player=player_room.player):
            await sio.emit("Location.Rename", data, room=psid, namespace=GAME_NS)


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
            await sio.emit(
                "Location.Archive", location_id, room=psid, namespace=GAME_NS
            )


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
            await sio.emit(
                "Location.Unarchive", location_id, room=psid, namespace=GAME_NS
            )


@sio.on("Location.Spawn.Info.Get", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def get_location_spawn_info(sid: str, location_id: int):
    pr: PlayerRoom = game_state.get(sid)

    if pr.role != Role.DM:
        logger.warning(f"{pr.player.name} attempted to retrieve spawn locations.")
        return

    data = []

    try:
        location = Location.get_by_id(location_id)
        if location.options is not None:
            for spawn in json.loads(location.options.spawn_locations):
                try:
                    shape = Shape.get_by_id(spawn)
                except Shape.DoesNotExist:
                    pass
                else:
                    data.append(shape.as_dict(pr.player, True))
    except:
        logger.exception("Could not load spawn locations")

    await sio.emit("Location.Spawn.Info", data=data, room=sid, namespace=GAME_NS)
