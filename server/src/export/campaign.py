import asyncio
import os
import secrets
import shutil
import tarfile
import uuid
from functools import partial
from io import BytesIO
from pathlib import Path
from time import time
from typing import Dict, List, Literal, Optional, Union, cast

from playhouse.shortcuts import model_to_dict
from playhouse.sqlite_ext import SqliteExtDatabase

from ..api.socket.constants import DASHBOARD_NS
from ..app import sio
from ..config import SAVE_FILE
from ..db.all import ALL_MODELS
from ..db.db import db as ACTIVE_DB
from ..db.db import open_db
from ..db.models.asset import Asset
from ..db.models.asset_rect import AssetRect
from ..db.models.aura import Aura
from ..db.models.character import Character
from ..db.models.circle import Circle
from ..db.models.circular_token import CircularToken
from ..db.models.composite_shape_association import CompositeShapeAssociation
from ..db.models.constants import Constants
from ..db.models.data_block import DataBlock
from ..db.models.floor import Floor
from ..db.models.group import Group
from ..db.models.initiative import Initiative
from ..db.models.layer import Layer
from ..db.models.line import Line
from ..db.models.location import Location
from ..db.models.location_options import LocationOptions
from ..db.models.location_user_option import LocationUserOption
from ..db.models.marker import Marker
from ..db.models.note import Note
from ..db.models.note_access import NoteAccess
from ..db.models.note_shape import NoteShape
from ..db.models.player_room import PlayerRoom
from ..db.models.polygon import Polygon
from ..db.models.rect import Rect
from ..db.models.room import Room
from ..db.models.room_data_block import RoomDataBlock
from ..db.models.shape import Shape
from ..db.models.shape_data_block import ShapeDataBlock
from ..db.models.shape_owner import ShapeOwner
from ..db.models.text import Text
from ..db.models.toggle_composite import ToggleComposite
from ..db.models.tracker import Tracker
from ..db.models.user import User
from ..db.models.user_options import UserOptions
from ..db.typed import SelectSequence
from ..logs import logger
from ..save import SAVE_VERSION, upgrade_save
from ..state.dashboard import dashboard_state
from ..utils import ASSETS_DIR, TEMP_DIR, get_asset_hash_subpath


async def export_campaign(
    filename: str,
    rooms: List[Room],
    *,
    sid: Optional[str] = None,
    export_all_assets=False,
):
    loop = asyncio.get_running_loop()
    task = loop.run_in_executor(
        None,
        partial(__export_campaign, export_all_assets=export_all_assets, loop=loop),
        filename,
        rooms,
        sid,
    )
    await asyncio.wait([task])
    await sio.emit("Campaign.Export.Done", filename, room=sid, namespace=DASHBOARD_NS)


async def import_campaign(
    user: User,
    pac: BytesIO,
    *,
    name: str,
    take_over_name: bool,
    sid: Optional[str] = None,
):
    loop = asyncio.get_running_loop()
    task = loop.run_in_executor(
        None,
        partial(__import_campaign, loop=loop),
        user,
        pac,
        name,
        take_over_name,
        sid,
    )
    await asyncio.wait([task])
    result = task.result()
    for _sid in dashboard_state.get_sids(id=user.id):
        await sio.emit(
            "Campaign.Import.Done",
            result,
            room=_sid,
            namespace=DASHBOARD_NS,
        )


def __export_campaign(
    name: str,
    rooms: List[Room],
    sid: Optional[str],
    *,
    export_all_assets=False,
    loop: Optional[asyncio.AbstractEventLoop] = None,
):
    try:
        CampaignExporter(
            name, rooms, sid, export_all_assets=export_all_assets, loop=loop
        ).pack()
    except:
        logger.exception("Export Failed")


def __import_campaign(
    user: User,
    pac: BytesIO,
    name: str,
    take_over_name: bool,
    sid: Optional[str],
    *,
    loop: Optional[asyncio.AbstractEventLoop] = None,
):
    try:
        ci = CampaignImporter(user, pac, name, take_over_name, sid, loop=loop)
        room = ci.get_created_room_info()
        if room is None:
            return {"success": True}
        return {"success": True, "name": room.name, "creator": room.creator.name}
    except Exception as e:
        logger.exception("Import Failed")
        return {"success": False, "reason": repr(e)}


def send_status(
    loop: Optional[asyncio.AbstractEventLoop],
    mode: Union[Literal["export"], Literal["import"]],
    sid: Optional[str],
    status: str,
):
    if sid is None or loop is None:
        return

    if mode == "import":
        event = "Campaign.Import.Status"
    else:
        event = "Campaign.Export.Status"
    coro = sio.emit(event, status, to=sid, namespace=DASHBOARD_NS)
    asyncio.run_coroutine_threadsafe(coro, loop)


class CampaignExporter:
    def __init__(
        self,
        name: str,
        rooms: List[Room],
        sid: Optional[str],
        *,
        export_all_assets=False,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        self.filename = name
        self.copy_name = TEMP_DIR / f"PA-temp-{str(uuid.uuid4())}.sqlite"
        self.sid = sid
        self.loop = loop

        send_status(self.loop, "export", self.sid, f"Starting campaign export {name}")
        send_status(self.loop, "export", self.sid, "> Generating empty database")
        self.generate_empty_db(rooms)
        for room in self.migrator.rooms:
            send_status(self.loop, "export", self.sid, f"> Exporting room {room.name}")
            send_status(self.loop, "export", self.sid, "    > Exporting user info")
            self.export_users(room)
            send_status(self.loop, "export", self.sid, "    > Exporting room info")
            self.migrator.migrate_room(room, room.name)
            send_status(self.loop, "export", self.sid, "    > Exporting characters")
            self.migrator.migrate_characters(room)
            send_status(self.loop, "export", self.sid, "    > Exporting locations")
            self.migrator.migrate_locations(room)
            self.migrator.migrate_character_shapes()
            send_status(self.loop, "export", self.sid, "    > Exporting player info")
            self.migrator.migrate_players(room)
            send_status(self.loop, "export", self.sid, "    > Exporting notes")
            self.migrator.migrate_notes(room)

        if export_all_assets:
            self.migrator.migrate_all_assets()

    def generate_empty_db(self, rooms: List[Room]):
        self.output_folder = TEMP_DIR
        os.makedirs(self.output_folder, exist_ok=True)
        self.sqlite_name = f"{self.filename}.sqlite"
        self.sqlite_path = self.output_folder / self.sqlite_name
        if self.sqlite_path.exists():
            os.remove(self.sqlite_path)

        self.db = open_db(self.sqlite_path)
        self.db.foreign_keys = False

        # The pragma call should make sure that all recent wal changes have been copied into the main sqlite file
        # So that copying just the sqlite file is enough
        ACTIVE_DB.execute_sql("PRAGMA wal_checkpoint(FULL)")
        shutil.copyfile(SAVE_FILE, self.copy_name)

        # Base model creation
        with self.db.bind_ctx(ALL_MODELS):
            self.db.create_tables(ALL_MODELS)
            # Generate constants (generate new set of tokens to prevent leaking server tokens)
            Constants.create(
                save_version=SAVE_VERSION,
                secret_token=secrets.token_bytes(32),
                api_token=secrets.token_hex(32),
            )
            self.migrator = CampaignMigrator(
                "export", open_db(self.copy_name), self.db, rooms, self.sid, self.loop
            )

    def pack(self):
        send_status(self.loop, "export", self.sid, "> Start packing data")
        self.db.close()

        tarname = f"{self.filename}.pac"
        tarpath = self.output_folder / tarname

        assets_dir_info = tarfile.TarInfo("assets")
        assets_dir_info.type = tarfile.DIRTYPE
        assets_dir_info.mode = 0o755
        assets_dir_info.mtime = time()  # type: ignore

        sqlite_info = tarfile.TarInfo(self.sqlite_name)
        sqlite_info.mode = 0o755
        sqlite_info.size = self.sqlite_path.stat().st_size
        sqlite_info.mtime = time()  # type: ignore

        try:
            import bz2  # noqa: F401

            write_mode = "w:bz2"
        except ImportError:
            write_mode = "w:gz"

        with tarfile.open(tarpath, write_mode) as tar:
            tar.addfile(sqlite_info, open(self.sqlite_path, "rb"))
            tar.addfile(assets_dir_info)

            for asset_id in self.migrator._asset_mapping.keys():
                asset: Asset = Asset[asset_id]
                if not asset.file_hash:
                    continue
                try:
                    full_hash_name = get_asset_hash_subpath(asset.file_hash)
                    file_path = ASSETS_DIR / full_hash_name
                    info = tar.gettarinfo(str(file_path))
                    info.name = str(Path("assets") / full_hash_name)
                    info.mtime = time()  # type: ignore
                    info.mode = 0o755
                    tar.addfile(info, open(file_path, "rb"))  # type: ignore
                except FileNotFoundError:
                    pass

        self.migrator.from_db.close()
        self.copy_name.unlink()

        send_status(self.loop, "export", self.sid, "> Done")

        return tarpath, tarname

    def export_users(self, room: Room):
        for player_room in room.players:
            user = cast(User, player_room.player)
            if user.id in self.migrator.user_mapping:
                continue

            user_data = model_to_dict(user, recurse=False)
            user_options_data = model_to_dict(user.default_options, recurse=False)
            del user_data["id"]
            del user_options_data["id"]

            with self.db.bind_ctx([UserOptions, User]):
                uo = UserOptions.create(**user_options_data)
                user_data["default_options"] = uo
                new_user = User.create(**user_data)
                new_user.set_password("PA_EXPORT")
                new_user.save()
                self.migrator.user_mapping[user.id] = new_user.id


class CampaignImporter:
    def __init__(
        self,
        user: User,
        pac: BytesIO,
        name: str,
        take_over_name: bool,
        sid: Optional[str],
        *,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        print("Starting campaign import")
        self.root_user = user
        self.location_mapping: Dict[int, int] = {}
        self.sid = sid
        self.loop = loop

        self.target_db = ACTIVE_DB

        send_status(
            self.loop, "import", self.sid, f"Starting campaign import for {user.name}"
        )
        self.unpack(pac)

        from_room = self.migrator.rooms[0]

        # todo: reconcile this with migrator being able to work with multiple rooms
        new_room_name = name if not take_over_name else from_room.name

        with self.target_db.bind_ctx([Room]):
            if Room.get_or_none(name=new_room_name, creator=user):
                raise Exception("Room with that name already exists")

        try:
            for room in self.migrator.rooms:
                send_status(
                    self.loop, "import", self.sid, f"> Importing room {room.name}"
                )
                send_status(self.loop, "import", self.sid, "    > Importing user info")
                self.import_users(room)
                send_status(self.loop, "import", self.sid, "    > Importing room info")
                self.migrator.migrate_room(room, new_room_name)
                send_status(self.loop, "import", self.sid, "    > Importing characters")
                self.migrator.migrate_characters(room)
                send_status(self.loop, "import", self.sid, "    > Importing locations")
                self.migrator.migrate_locations(room)
                self.migrator.migrate_character_shapes()
                send_status(
                    self.loop, "import", self.sid, "    > Importing player info"
                )
                self.migrator.migrate_players(room)
                send_status(self.loop, "import", self.sid, "    > Importing notes")
                self.migrator.migrate_notes(room)
            print("Completed campaign import")
        except Exception as e:
            if r := Room.get_or_none(name=new_room_name, creator=user):
                r.delete_instance(True)
            raise e
        finally:
            self.db.close()

    def get_created_room_info(self):
        with self.target_db.bind_ctx([Room]):
            for room_id in self.migrator.room_mapping.values():
                return Room.get_by_id(room_id)

    def unpack(self, pac: BytesIO):
        send_status(self.loop, "import", self.sid, "> Unpack data")
        with tarfile.open(fileobj=pac, mode="r") as tar:
            assets = []
            for member in tar.getmembers():
                # security checks
                if member.islnk() or member.issym():
                    continue
                if member.name.startswith("/") or ".." in member.name:
                    continue

                if member.name.startswith("assets/"):
                    filehash = member.name.split("/")[-1]

                    # check if hash is a valid hexstring
                    try:
                        int(filehash, 16)
                    except ValueError:
                        continue
                    if len(filehash) % 2 != 0:
                        continue

                    full_hash_name = get_asset_hash_subpath(filehash)

                    if member.name != str(Path("assets") / full_hash_name):
                        continue

                    if (ASSETS_DIR / full_hash_name).exists():
                        continue

                    assets.append(member)
                elif member.name.endswith(".sqlite") and "/" not in member.name:
                    sqlite_f = tar.extractfile(member)
                    if sqlite_f is None:
                        raise Exception("Faulty sqlite file")
                    with open(TEMP_DIR / f"import-{member.name}", "wb") as f:
                        f.write(sqlite_f.read())
                    self.db = open_db(TEMP_DIR / f"import-{member.name}")
                    self.db.foreign_keys = False

                    upgrade_save(self.db, is_import=True)

                    self.migrator = CampaignMigrator(
                        "import", self.db, ACTIVE_DB, None, self.sid, loop=self.loop
                    )

            if len(assets) > 0:
                send_status(
                    self.loop, "import", self.sid, f"> Importing {len(assets)} asset(s)"
                )
                tar.extractall(path=ASSETS_DIR.parent, members=assets)

    def import_users(self, room: Room):
        # Different modes should be available
        # a) map all users to root_user
        # b) only map room creator to root_user, ignore all other users [current implementation]
        # c) map room creator to root_user, create fresh users for other accounts
        # d) Allow defining user mapping up-front
        # ideally this becomes a multi-step UI heavy thing
        # where user options can also be diffed etc (user default_options todo!)
        with self.db.bind_ctx([Room, User]):
            creator = cast(User, room.creator)
            self.migrator.user_mapping[creator.id] = self.root_user.id


class CampaignMigrator:
    def __init__(
        self,
        mode: Union[Literal["export"], Literal["import"]],
        from_db: SqliteExtDatabase,
        to_db: SqliteExtDatabase,
        rooms: Optional[List[Room]] = None,
        sid: Optional[str] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> None:
        self.mode: Union[Literal["export"], Literal["import"]] = mode
        self.from_db = from_db
        self.to_db = to_db
        self.rooms = rooms if rooms else self.__rooms
        self.sid = sid
        self.loop = loop

        self._asset_mapping: Dict[int, int] = {}
        self.aura_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.character_mapping: Dict[int, int] = {}
        self._group_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.layer_mapping: Dict[int, int] = {}
        self.location_mapping: Dict[int, int] = {}
        self.room_mapping: Dict[int, int] = {}
        self._shape_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.tracker_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.user_mapping: Dict[int, int] = {}

    @property
    def __rooms(self) -> SelectSequence[Room]:
        with self.from_db.bind_ctx([Room]):
            return Room.select()

    def migrate_asset(self, asset_id: int) -> Optional[int]:
        if asset_id in self._asset_mapping:
            return self._asset_mapping[asset_id]

        with self.from_db.bind_ctx([Asset]):
            try:
                asset = Asset.get_by_id(asset_id)
            except Asset.DoesNotExist:
                return None

            asset_data = model_to_dict(asset, recurse=False)
            del asset_data["id"]
            asset_data["owner"] = self.user_mapping[asset_data["owner"]]

            if asset.parent is not None:
                asset_data["parent"] = self.migrate_asset(asset_data["parent"])

        with self.to_db.bind_ctx([Asset]):
            asset = Asset.create(**asset_data)
            self._asset_mapping[asset_id] = asset.id
        return asset.id

    def migrate_all_assets(self):
        with self.from_db.bind_ctx([Asset]):
            for asset in Asset.filter(owner=self.rooms[0].creator):
                self.migrate_asset(asset.id)

    def migrate_room(self, room: Room, name: str):
        with self.from_db.bind_ctx([LocationOptions, Room]):
            room_options_data = model_to_dict(room.default_options, recurse=False)
            del room_options_data["id"]

            room_data = model_to_dict(room, recurse=False)
            del room_data["id"]

        with self.to_db.bind_ctx([LocationOptions, Room]):
            lo = LocationOptions.create(**room_options_data)

            room_data["name"] = name
            room_data["creator"] = self.user_mapping[room_data["creator"]]
            room_data["default_options"] = lo
            room_data["logo"] = self.migrate_asset(room_data["logo"])
            room_data["invitation_code"] = uuid.uuid4()

            self.room_mapping[room.id] = Room.create(**room_data).id

        self.migrate_room_datablocks(room)

    def migrate_room_datablocks(self, room: Room):
        with self.from_db.bind_ctx([DataBlock, RoomDataBlock]):
            for data_block in RoomDataBlock.filter(room=room):
                data_block_data = model_to_dict(data_block, recurse=False)
                del data_block_data["id"]
                data_block_data["room"] = self.room_mapping[room.id]

                with self.to_db.bind_ctx([DataBlock, RoomDataBlock]):
                    RoomDataBlock.create(**data_block_data)

    def migrate_characters(self, room: Room):
        with self.from_db.bind_ctx([Character]):
            for character in Character.filter(campaign=room):
                character_data = model_to_dict(character, recurse=False)

                del character_data["id"]
                character_data["owner"] = self.user_mapping.get(character_data["owner"])
                character_data["asset"] = self.migrate_asset(character_data["asset"])

                if character_data["campaign"]:
                    character_data["campaign"] = self.room_mapping[room.id]

                with self.to_db.bind_ctx([Character]):
                    c = Character.create(**character_data)
                    self.character_mapping[character.id] = c.id

    # Shapes are only migrated if they were associated with a layer so far
    # This function ensures that shapes _not_ associated with a layer,
    # but associated with a character that is related to the campaign
    # are also migrated
    def migrate_character_shapes(self):
        for character_id in self.character_mapping:
            with self.from_db.bind_ctx([Shape]):
                for shape in Shape.filter(character=character_id):
                    self.migrate_shape(shape.uuid)

    def migrate_locations(self, room: Room):
        with self.from_db.bind_ctx([Location, LocationOptions]):
            for location in room.locations:
                send_status(
                    self.loop, self.mode, self.sid, f"    > [LOC] {location.name}"
                )
                location_data = model_to_dict(location, recurse=False)
                del location_data["id"]
                location_data["room"] = self.room_mapping[room.id]

                location_options_data = None
                if location.options:
                    location_options_data = model_to_dict(
                        location.options, recurse=False
                    )
                    del location_options_data["id"]

                # signals trigger on this, so to be sure we bind extra
                with self.to_db.bind_ctx(
                    [Location, LocationOptions, PlayerRoom, Room, User]
                ):
                    if location_options_data:
                        lo = LocationOptions.create(**location_options_data)
                        location_data["options"] = lo
                    new_location = Location.create(**location_data).id
                    self.location_mapping[location.id] = new_location

                self.migrate_floors(new_location, location.floors)

                if len(location.initiative) > 0:
                    self.migrate_initiative(new_location, location.initiative[0])

                self.migrate_location_user_options(new_location, location.user_options)
                self.migrate_markers(new_location, location.markers)

    def migrate_floors(self, location_id: int, floors: SelectSequence[Floor]):
        with self.from_db.bind_ctx([Floor]):
            for floor in floors:
                send_status(self.loop, self.mode, self.sid, f"    >  [FL] {floor.name}")
                floor_data = model_to_dict(floor, recurse=False)
                del floor_data["id"]
                floor_data["location"] = location_id

                with self.to_db.bind_ctx([Floor]):
                    new_floor = Floor.create(**floor_data)

                self.migrate_layers(new_floor.id, floor.layers)

    def migrate_layers(self, floor_id: int, layers: SelectSequence[Layer]):
        with self.from_db.bind_ctx([Layer]):
            for layer in layers:
                send_status(
                    self.loop, self.mode, self.sid, f"    >   [LAY] {layer.name}"
                )
                layer_data = model_to_dict(layer, recurse=False)
                del layer_data["id"]
                layer_data["floor"] = floor_id

                with self.to_db.bind_ctx([Layer]):
                    new_layer = Layer.create(**layer_data)
                    self.layer_mapping[layer.id] = new_layer.id

                for shape in layer.shapes:
                    self.migrate_shape(shape.uuid)

    def migrate_shape(self, shape_id: str):
        if shape_id in self._shape_mapping:
            return self._shape_mapping[shape_id]

        with self.from_db.bind_ctx([Shape]):
            try:
                shape = Shape.get_by_id(shape_id)
            except Shape.DoesNotExist:
                return

            shape_data = model_to_dict(shape, recurse=False)
            new_uuid = uuid.uuid4()
            self._shape_mapping[shape_data["uuid"]] = new_uuid
            shape_data["uuid"] = new_uuid

            if shape_data["layer"]:
                shape_data["layer"] = self.layer_mapping[shape_data["layer"]]
            if shape_data["asset"]:
                shape_data["asset"] = self.migrate_asset(shape_data["asset"])
            if shape_data["group"]:
                shape_data["group"] = self.migrate_group(shape_data["group"])
            if shape_data["character"]:
                shape_data["character"] = self.character_mapping[
                    shape_data["character"]
                ]

            with self.to_db.bind_ctx([Shape]):
                Shape.create(**shape_data)

            self.migrate_trackers(shape.trackers)
            self.migrate_auras(shape.auras)
            self.migrate_shape_owners(shape.owners)
            self.migrate_assetrect(shape.assetrect_set)
            self.migrate_circle(shape.circle_set)
            self.migrate_circulartoken(shape.circulartoken_set)
            self.migrate_line(shape.line_set)
            self.migrate_polygon(shape.polygon_set)
            self.migrate_rect(shape.rect_set)
            self.migrate_text(shape.text_set)
            self.migrate_togglecomposite(shape.togglecomposite_set)
            self.migrate_composite_shape_associations(shape.shape_variants)
            self.migrate_shape_datablocks(new_uuid, shape.data_blocks)

    def migrate_group(self, group_id: str):
        if group_id in self._group_mapping:
            return self._group_mapping[group_id]

        with self.from_db.bind_ctx([Group]):
            group = Group.get_by_id(group_id)
            group_data = model_to_dict(group, recurse=False)
            new_uuid = uuid.uuid4()
            self._group_mapping[group_data["uuid"]] = new_uuid
            group_data["uuid"] = new_uuid

        with self.to_db.bind_ctx([Group]):
            Group.create(**group_data)

        return new_uuid

    def migrate_trackers(self, trackers: SelectSequence[Tracker]):
        with self.from_db.bind_ctx([Tracker]):
            for tracker in trackers:
                tracker_data = model_to_dict(tracker, recurse=False)
                new_uuid = uuid.uuid4()
                self.tracker_mapping[tracker_data["uuid"]] = new_uuid
                tracker_data["uuid"] = new_uuid
                tracker_data["shape"] = self.migrate_shape(tracker_data["shape"])

                with self.to_db.bind_ctx([Tracker]):
                    Tracker.create(**tracker_data)

    def migrate_auras(self, auras: SelectSequence[Aura]):
        with self.from_db.bind_ctx([Aura]):
            for aura in auras:
                aura_data = model_to_dict(aura, recurse=False)
                new_uuid = uuid.uuid4()
                self.aura_mapping[aura_data["uuid"]] = new_uuid
                aura_data["uuid"] = new_uuid
                aura_data["shape"] = self.migrate_shape(aura_data["shape"])

                with self.to_db.bind_ctx([Aura]):
                    Aura.create(**aura_data)

    def migrate_shape_owners(self, owners: SelectSequence[ShapeOwner]):
        with self.from_db.bind_ctx([ShapeOwner]):
            for owner in owners:
                owner_data = model_to_dict(owner, recurse=False)
                del owner_data["id"]
                owner_data["shape"] = self.migrate_shape(owner_data["shape"])
                owner_data["user"] = self.user_mapping.get(owner_data["user"])
                if owner_data["user"] is None:
                    continue

                with self.to_db.bind_ctx([ShapeOwner]):
                    ShapeOwner.create(**owner_data)

    def migrate_composite_shape_associations(
        self, associations: SelectSequence[CompositeShapeAssociation]
    ):
        with self.from_db.bind_ctx([CompositeShapeAssociation]):
            for association in associations:
                association_data = model_to_dict(association, recurse=False)
                del association_data["id"]
                association_data["variant"] = self.migrate_shape(
                    association_data["variant"]
                )
                association_data["parent"] = self.migrate_shape(
                    association_data["parent"]
                )
                if (
                    association_data["variant"] is None
                    or association_data["parent"] is None
                ):
                    continue

                with self.to_db.bind_ctx([CompositeShapeAssociation]):
                    CompositeShapeAssociation.create(**association_data)

    def migrate_assetrect(self, rects: SelectSequence[AssetRect]):
        with self.from_db.bind_ctx([AssetRect]):
            for rect in rects:
                rect_data = model_to_dict(rect, recurse=False)
                rect_data["shape"] = self.migrate_shape(rect_data["shape"])

                with self.to_db.bind_ctx([AssetRect]):
                    AssetRect.create(**rect_data)

    def migrate_circle(self, circles: SelectSequence[Circle]):
        with self.from_db.bind_ctx([Circle]):
            for circle in circles:
                circle_data = model_to_dict(circle, recurse=False)
                circle_data["shape"] = self.migrate_shape(circle_data["shape"])

                with self.to_db.bind_ctx([Circle]):
                    Circle.create(**circle_data)

    def migrate_circulartoken(self, circulartokens: SelectSequence[CircularToken]):
        with self.from_db.bind_ctx([CircularToken]):
            for circulartoken in circulartokens:
                circulartoken_data = model_to_dict(circulartoken, recurse=False)
                circulartoken_data["shape"] = self.migrate_shape(
                    circulartoken_data["shape"]
                )

                with self.to_db.bind_ctx([CircularToken]):
                    CircularToken.create(**circulartoken_data)

    def migrate_line(self, lines: SelectSequence[Line]):
        with self.from_db.bind_ctx([Line]):
            for line in lines:
                line_data = model_to_dict(line, recurse=False)
                line_data["shape"] = self.migrate_shape(line_data["shape"])

                with self.to_db.bind_ctx([Line]):
                    Line.create(**line_data)

    def migrate_polygon(self, polygons: SelectSequence[Polygon]):
        with self.from_db.bind_ctx([Polygon]):
            for polygon in polygons:
                polygon_data = model_to_dict(polygon, recurse=False)
                polygon_data["shape"] = self.migrate_shape(polygon_data["shape"])

                with self.to_db.bind_ctx([Polygon]):
                    Polygon.create(**polygon_data)

    def migrate_rect(self, rects: SelectSequence[Rect]):
        with self.from_db.bind_ctx([Rect]):
            for rect in rects:
                rect_data = model_to_dict(rect, recurse=False)
                rect_data["shape"] = self.migrate_shape(rect_data["shape"])

                with self.to_db.bind_ctx([Rect]):
                    Rect.create(**rect_data)

    def migrate_text(self, texts: SelectSequence[Text]):
        with self.from_db.bind_ctx([Text]):
            for text in texts:
                text_data = model_to_dict(text, recurse=False)
                text_data["shape"] = self.migrate_shape(text_data["shape"])

                with self.to_db.bind_ctx([Text]):
                    Text.create(**text_data)

    def migrate_togglecomposite(
        self, togglecomposites: SelectSequence[ToggleComposite]
    ):
        with self.from_db.bind_ctx([ToggleComposite]):
            for togglecomposite in togglecomposites:
                togglecomposite_data = model_to_dict(togglecomposite, recurse=False)
                togglecomposite_data["shape"] = self.migrate_shape(
                    togglecomposite_data["shape"]
                )
                togglecomposite_data["active_variant"] = self.migrate_shape(
                    togglecomposite_data["active_variant"]
                )

                with self.to_db.bind_ctx([ToggleComposite]):
                    ToggleComposite.create(**togglecomposite_data)

    def migrate_shape_datablocks(
        self, new_uuid: uuid.UUID, data_blocks: SelectSequence[ShapeDataBlock]
    ):
        with self.from_db.bind_ctx([DataBlock, ShapeDataBlock]):
            for data_block in data_blocks:
                data_block_data = model_to_dict(data_block, recurse=False)
                del data_block_data["id"]
                data_block_data["shape"] = new_uuid

                with self.to_db.bind_ctx([DataBlock, ShapeDataBlock]):
                    ShapeDataBlock.create(**data_block_data)

    def migrate_initiative(self, location_id: int, initiative: Initiative):
        with self.from_db.bind_ctx([Initiative]):
            initiative_data = model_to_dict(initiative, recurse=False)
            del initiative_data["id"]
            initiative_data["location"] = location_id

            with self.to_db.bind_ctx([Initiative]):
                Initiative.create(**initiative_data)

    def migrate_location_user_options(
        self, new_location_id: int, user_options: List[LocationUserOption]
    ):
        with self.from_db.bind_ctx([LocationUserOption]):
            for user_option in user_options:
                user_option_data = model_to_dict(user_option, recurse=False)

                user = self.user_mapping.get(user_option_data["user"])
                if user is None:
                    continue

                del user_option_data["id"]
                user_option_data["location"] = new_location_id
                user_option_data["user"] = user
                if user_option_data["active_layer"]:
                    user_option_data["active_layer"] = self.layer_mapping[
                        user_option_data["active_layer"]
                    ]

                with self.to_db.bind_ctx([LocationUserOption]):
                    q = LocationUserOption.select().where(
                        (LocationUserOption.location == new_location_id)
                        & (LocationUserOption.user == user)
                    )
                    if q.exists():
                        q[0].update(**user_option_data).where(
                            (LocationUserOption.location == new_location_id)
                            & (LocationUserOption.user == user)
                        ).execute()
                    else:
                        LocationUserOption.create(**user_option_data)

    def migrate_markers(self, new_location_id: int, markers: SelectSequence[Marker]):
        with self.from_db.bind_ctx([Marker]):
            for marker in markers:
                marker_data = model_to_dict(marker, recurse=False)

                user = self.user_mapping.get(marker_data["user"])
                if user is None:
                    continue

                del marker_data["id"]
                marker_data["location"] = new_location_id
                marker_data["user"] = user
                marker_data["shape"] = self.migrate_shape(marker_data["shape"])
                if marker_data["shape"] is None:
                    # Technically possible, but not intended
                    # This happens when a marker is set to shape that is later moved to a different location
                    continue

                with self.to_db.bind_ctx([Marker]):
                    Marker.create(**marker_data)

    def migrate_players(self, room: Room):
        with self.from_db.bind_ctx([PlayerRoom, User, UserOptions]):
            for player_room in room.players:
                if player_room.player.id not in self.user_mapping:
                    continue

                player_data = model_to_dict(player_room, recurse=False)
                del player_data["id"]

                player_options_data = None
                if player_room.user_options:
                    player_options_data = model_to_dict(
                        player_room.user_options, recurse=False
                    )
                    del player_options_data["id"]

                player_data["room"] = self.room_mapping[room.id]
                player_data["player"] = self.user_mapping[player_data["player"]]
                player_data["active_location"] = self.location_mapping[
                    player_data["active_location"]
                ]

                with self.to_db.bind_ctx([PlayerRoom, UserOptions]):
                    if player_options_data:
                        player_data["user_options"] = UserOptions.create(
                            **player_options_data
                        )
                    PlayerRoom.create(**player_data)

    def migrate_notes(self, room: Room):
        with self.from_db.bind_ctx([Note, NoteAccess, NoteShape]):
            for note in Note.filter(room=room):
                note_data = model_to_dict(note, recurse=False)
                new_uuid = uuid.uuid4()
                note_data["uuid"] = new_uuid
                note_data["creator"] = self.user_mapping.get(note_data["creator"])

                # This is in principle optional, but we're specifically filtering on room notes
                note_data["room"] = self.room_mapping[room.id]

                if note_data["location"]:
                    note_data["location"] = self.location_mapping[note_data["location"]]

                with self.to_db.bind_ctx([Note]):
                    Note.create(**note_data)

                for access in note.access:
                    access_data = model_to_dict(access, recurse=False)
                    del access_data["id"]
                    access_data["note"] = new_uuid

                    if access_data["user"]:
                        access_data["user"] = self.user_mapping.get(access_data["user"])

                    with self.to_db.bind_ctx([NoteAccess]):
                        NoteAccess.create(**access_data)

                for shape in note.shapes:
                    shape_data = model_to_dict(shape, recurse=False)
                    del shape_data["id"]
                    shape_data["note"] = new_uuid
                    shape_data["shape"] = self.migrate_shape(shape_data["shape"])

                    # This is a shape from another campaign that is somehow linked to this note
                    if shape_data["shape"] is None:
                        continue

                    with self.to_db.bind_ctx([NoteShape]):
                        NoteShape.create(**shape_data)
