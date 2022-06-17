import asyncio
import os
import secrets
import shutil
import tarfile
import uuid
from functools import partial
from io import BytesIO
from time import time
from typing import Dict, List, Optional, cast

from playhouse.shortcuts import model_to_dict
from playhouse.sqlite_ext import SqliteExtDatabase

from api.socket.constants import DASHBOARD_NS
from app import sio
from config import SAVE_FILE
from logs import logger
from models import ALL_MODELS
from models.asset import Asset
from models.campaign import (
    Floor,
    Layer,
    Location,
    LocationOptions,
    LocationUserOption,
    Note,
    PlayerRoom,
    Room,
)
from models.db import db as ACTIVE_DB, open_db
from models.general import Constants
from models.groups import Group
from models.initiative import Initiative
from models.label import LabelSelection
from models.marker import Marker
from models.shape import (
    AssetRect,
    Aura,
    Circle,
    CircularToken,
    CompositeShapeAssociation,
    Label,
    Line,
    Polygon,
    Rect,
    Shape,
    ShapeLabel,
    ShapeOwner,
    Text,
    ToggleComposite,
    Tracker,
)
from models.typed import SelectSequence
from models.user import User, UserOptions
from save import SAVE_VERSION, upgrade_save
from utils import ASSETS_DIR, SAVE_DIR, STATIC_DIR, TEMP_DIR

debug_log = False


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
        partial(__export_campaign, export_all_assets=export_all_assets),
        filename,
        rooms,
    )
    await asyncio.wait([task])
    await sio.emit("Campaign.Export.Done", filename, room=sid, namespace=DASHBOARD_NS)


async def import_campaign(user: User, pac: BytesIO):
    loop = asyncio.get_running_loop()
    task = loop.run_in_executor(None, __import_campaign, user, pac)
    await asyncio.wait([task])


def __export_campaign(name: str, rooms: List[Room], *, export_all_assets=False):
    try:
        CampaignExporter(name, rooms, export_all_assets=export_all_assets).pack()
    except:
        logger.exception("Export Failed")


def __import_campaign(user: User, pac: BytesIO):
    try:
        CampaignImporter(user, pac)
    except:
        logger.exception("Import Failed")


class CampaignExporter:
    def __init__(
        self, name: str, rooms: List[Room], *, export_all_assets=False
    ) -> None:
        self.filename = name
        self.copy_name = TEMP_DIR / f"{str(uuid.uuid4())}.sqlite"

        self.generate_empty_db(rooms)
        for room in self.migrator.rooms:
            self.export_users(room)
            self.migrator.migrate_room(room)
            self.migrator.migrate_label_selections(room)
            self.migrator.migrate_locations(room)
            self.migrator.migrate_players(room)
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
            self.migrator = CampaignMigrator(open_db(self.copy_name), self.db, rooms)

    def pack(self):
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
            import bz2

            write_mode = "w:bz2"
        except ImportError:
            write_mode = "w:gz"

        with tarfile.open(tarpath, write_mode) as tar:
            tar.addfile(sqlite_info, open(self.sqlite_path, "rb"))
            tar.addfile(assets_dir_info)

            for asset_id in self.migrator.asset_mapping.keys():
                asset: Asset = Asset[asset_id]
                if not asset.file_hash:
                    continue
                try:
                    file_path = ASSETS_DIR / asset.file_hash
                    info = tar.gettarinfo(str(file_path))
                    info.name = f"assets/{asset.file_hash}"
                    info.mtime = time()  # type: ignore
                    info.mode = 0o755
                    tar.addfile(info, open(file_path, "rb"))  # type: ignore
                except FileNotFoundError:
                    pass

        self.migrator.from_db.close()
        self.copy_name.unlink()

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

            self.migrator.migrate_labels(new_user.id, user.labels)


class CampaignImporter:
    def __init__(self, user: User, pac: BytesIO) -> None:
        print("Starting campaign import")
        self.root_user = user
        self.location_mapping: Dict[int, int] = {}

        self.target_db = ACTIVE_DB

        self.unpack(pac)
        # with self.migrator.to_db.atomic():
        for room in self.migrator.rooms:
            self.import_users(room)
            self.migrator.migrate_room(room)
            self.migrator.migrate_label_selections(room)
            self.migrator.migrate_locations(room)
            self.migrator.migrate_players(room)
            self.migrator.migrate_notes(room)
        print("Completed campaign import")
        self.db.close()

    def unpack(self, pac: BytesIO):
        with tarfile.open(fileobj=pac, mode="r") as tar:
            assets = []
            for member in tar.getmembers():
                # security checks
                if member.islnk() or member.issym():
                    continue
                if member.name.startswith("/") or ".." in member.name:
                    continue

                if member.name.startswith("assets/"):
                    filehash = member.name[len("assets/") :]

                    # check if hash is a valid hexstring
                    try:
                        int(filehash, 16)
                    except ValueError:
                        continue
                    if len(filehash) % 2 != 0:
                        continue

                    if (ASSETS_DIR / filehash).exists():
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

                    self.migrator = CampaignMigrator(self.db, ACTIVE_DB)

            if len(assets) > 0:
                print(f"Extracting {len(assets)} asset(s)")
                tar.extractall(path=STATIC_DIR, members=assets)

    def import_users(self, room: Room):
        # Different modes should be available
        # a) map all users to root_user
        # b) only map room creator to root_user, ignore all other users [current implementation]
        # c) map room creator to root_user, create fresh users for other accounts
        # d) Allow defining user mapping up-front
        # ideally this becomes a multi-step UI heavy thing
        # where user options can also be diffed etc (user default_options todo!)
        # todo: Labels
        with self.db.bind_ctx([Room, User]):
            creator = cast(User, room.creator)
            self.migrator.user_mapping[creator.id] = self.root_user.id

            with self.migrator.from_db.bind_ctx([Room, User, Label]):
                self.migrator.migrate_labels(self.root_user.id, room.creator.labels)


class CampaignMigrator:
    def __init__(
        self,
        from_db: SqliteExtDatabase,
        to_db: SqliteExtDatabase,
        rooms: Optional[List[Room]] = None,
    ) -> None:
        self.from_db = from_db
        self.to_db = to_db
        self.rooms = rooms if rooms else self.__rooms

        self.asset_mapping: Dict[int, int] = {}
        self.aura_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.group_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.label_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.layer_mapping: Dict[int, int] = {}
        self.location_mapping: Dict[int, int] = {}
        self.note_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.room_mapping: Dict[int, int] = {}
        self.shape_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.tracker_mapping: Dict[uuid.UUID, uuid.UUID] = {}
        self.user_mapping: Dict[int, int] = {}

    @property
    def __rooms(self) -> SelectSequence[Room]:
        with self.from_db.bind_ctx([Room]):
            return Room.select()

    def migrate_asset(self, asset_id: int) -> Optional[int]:
        if asset_id in self.asset_mapping:
            return self.asset_mapping[asset_id]

        with self.from_db.bind_ctx([Asset]):
            try:
                asset = Asset.get_by_id(asset_id)
            except Asset.DoesNotExist:
                return None

            asset_data = model_to_dict(asset, recurse=False)
            del asset_data["id"]
            asset_data["owner"] = self.user_mapping[asset_data["owner"]]

            if asset.parent is not None:
                self.migrate_asset(asset_data["parent"])
                asset_data["parent"] = self.asset_mapping[asset_data["parent"]]

        with self.to_db.bind_ctx([Asset]):
            asset = Asset.create(**asset_data)
            self.asset_mapping[asset_id] = asset.id
        return asset.id

    def migrate_all_assets(self):
        with self.from_db.bind_ctx([Asset]):
            for asset in Asset.filter(owner=self.rooms[0].creator):
                self.migrate_asset(asset.id)

    def migrate_labels(self, new_user_id: int, labels: List[Label]):
        with self.from_db.bind_ctx([Label]):
            for label in labels:
                label_data = model_to_dict(label, recurse=False)
                label_data["user"] = new_user_id
                new_uuid = uuid.uuid4()
                self.label_mapping[label_data["uuid"]] = new_uuid
                label_data["uuid"] = new_uuid

                with self.to_db.bind_ctx([Label]):
                    Label.create(**label_data)

    def migrate_room(self, room: Room):
        if debug_log:
            print(f"[ROOM] {room.name}")
        with self.from_db.bind_ctx([LocationOptions, Room]):
            room_options_data = model_to_dict(room.default_options, recurse=False)
            del room_options_data["id"]

            room_data = model_to_dict(room, recurse=False)
            del room_data["id"]

        with self.to_db.bind_ctx([LocationOptions, Room]):
            lo = LocationOptions.create(**room_options_data)

            room_data["creator"] = self.user_mapping[room_data["creator"]]
            room_data["default_options"] = lo
            room_data["logo"] = self.migrate_asset(room_data["logo"])
            room_data["invitation_code"] = uuid.uuid4()

            self.room_mapping[room.id] = Room.create(**room_data).id

    def migrate_label_selections(self, room: Room):
        with self.from_db.bind_ctx([LabelSelection]):
            for label_selection in LabelSelection.filter(room=room):
                label_selection_data = model_to_dict(label_selection, recurse=False)
                del label_selection_data["id"]
                target_user = self.user_mapping.get(label_selection_data["user"])
                if target_user is None:
                    continue
                label_selection_data["label"] = self.label_mapping[
                    label_selection_data["label"]
                ]
                label_selection_data["user"] = target_user
                label_selection_data["room"] = self.room_mapping[room.id]

                with self.to_db.bind_ctx([LabelSelection]):
                    LabelSelection.create(**label_selection_data)

    def migrate_locations(self, room: Room):
        with self.from_db.bind_ctx([Location, LocationOptions]):
            for location in room.locations:
                if debug_log:
                    print(f" [LOC] {location.name}")
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
                if debug_log:
                    print(f"  [FL] {floor.name}")
                floor_data = model_to_dict(floor, recurse=False)
                del floor_data["id"]
                floor_data["location"] = location_id

                with self.to_db.bind_ctx([Floor]):
                    new_floor = Floor.create(**floor_data)

                self.migrate_layers(new_floor.id, floor.layers)

    def migrate_layers(self, floor_id: int, layers: SelectSequence[Layer]):
        with self.from_db.bind_ctx([Layer]):
            for layer in layers:
                if debug_log:
                    print(f"   [LAY] {layer.name}")
                layer_data = model_to_dict(layer, recurse=False)
                del layer_data["id"]
                layer_data["floor"] = floor_id

                with self.to_db.bind_ctx([Layer]):
                    new_layer = Layer.create(**layer_data)
                    self.layer_mapping[layer.id] = new_layer.id

                self.migrate_shapes(new_layer.id, layer.shapes)

    def migrate_shapes(self, layer_id: int, shapes: SelectSequence[Shape]):
        with self.from_db.bind_ctx([Shape]):
            for shape in shapes:
                shape_data = model_to_dict(shape, recurse=False)
                new_uuid = uuid.uuid4()
                self.shape_mapping[shape_data["uuid"]] = new_uuid
                shape_data["uuid"] = new_uuid
                shape_data["layer"] = layer_id
                if shape_data["asset"]:
                    shape_data["asset"] = self.migrate_asset(shape_data["asset"])
                if shape_data["group"]:
                    shape_data["group"] = self.migrate_group(shape_data["group"])

                with self.to_db.bind_ctx([Shape]):
                    Shape.create(**shape_data)

                self.migrate_shape_labels(shape.labels)
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

    def migrate_group(self, group_id: str):
        if group_id in self.group_mapping:
            return self.group_mapping[group_id]

        with self.from_db.bind_ctx([Group]):
            group = Group.get_by_id(group_id)
            group_data = model_to_dict(group, recurse=False)
            new_uuid = uuid.uuid4()
            self.group_mapping[group_data["uuid"]] = new_uuid
            group_data["uuid"] = new_uuid

        with self.to_db.bind_ctx([Group]):
            Group.create(**group_data)

        return new_uuid

    def migrate_shape_labels(self, labels: SelectSequence[ShapeLabel]):
        with self.from_db.bind_ctx([ShapeLabel]):
            for label in labels:
                label_data = model_to_dict(label, recurse=False)
                del label_data["id"]
                label_data["shape"] = self.shape_mapping[label_data["shape"]]
                label_data["label"] = self.label_mapping[label_data["label"]]

                with self.to_db.bind_ctx([ShapeLabel]):
                    ShapeLabel.create(**label_data)

    def migrate_trackers(self, trackers: SelectSequence[Tracker]):
        with self.from_db.bind_ctx([Tracker]):
            for tracker in trackers:
                tracker_data = model_to_dict(tracker, recurse=False)
                new_uuid = uuid.uuid4()
                self.tracker_mapping[tracker_data["uuid"]] = new_uuid
                tracker_data["uuid"] = new_uuid
                tracker_data["shape"] = self.shape_mapping[tracker_data["shape"]]

                with self.to_db.bind_ctx([Tracker]):
                    Tracker.create(**tracker_data)

    def migrate_auras(self, auras: SelectSequence[Aura]):
        with self.from_db.bind_ctx([Aura]):
            for aura in auras:
                aura_data = model_to_dict(aura, recurse=False)
                new_uuid = uuid.uuid4()
                self.aura_mapping[aura_data["uuid"]] = new_uuid
                aura_data["uuid"] = new_uuid
                aura_data["shape"] = self.shape_mapping[aura_data["shape"]]

                with self.to_db.bind_ctx([Aura]):
                    Aura.create(**aura_data)

    def migrate_shape_owners(self, owners: SelectSequence[ShapeOwner]):
        with self.from_db.bind_ctx([ShapeOwner]):
            for owner in owners:
                owner_data = model_to_dict(owner, recurse=False)
                del owner_data["id"]
                owner_data["shape"] = self.shape_mapping[owner_data["shape"]]
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
                association_data["variant"] = self.shape_mapping.get(
                    association_data["variant"]
                )
                association_data["parent"] = self.shape_mapping.get(
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
                rect_data["shape"] = self.shape_mapping[rect_data["shape"]]

                with self.to_db.bind_ctx([AssetRect]):
                    AssetRect.create(**rect_data)

    def migrate_circle(self, circles: SelectSequence[Circle]):
        with self.from_db.bind_ctx([Circle]):
            for circle in circles:
                circle_data = model_to_dict(circle, recurse=False)
                circle_data["shape"] = self.shape_mapping[circle_data["shape"]]

                with self.to_db.bind_ctx([Circle]):
                    Circle.create(**circle_data)

    def migrate_circulartoken(self, circulartokens: SelectSequence[CircularToken]):
        with self.from_db.bind_ctx([CircularToken]):
            for circulartoken in circulartokens:
                circulartoken_data = model_to_dict(circulartoken, recurse=False)
                circulartoken_data["shape"] = self.shape_mapping[
                    circulartoken_data["shape"]
                ]

                with self.to_db.bind_ctx([CircularToken]):
                    CircularToken.create(**circulartoken_data)

    def migrate_line(self, lines: SelectSequence[Line]):
        with self.from_db.bind_ctx([Line]):
            for line in lines:
                line_data = model_to_dict(line, recurse=False)
                line_data["shape"] = self.shape_mapping[line_data["shape"]]

                with self.to_db.bind_ctx([Line]):
                    Line.create(**line_data)

    def migrate_polygon(self, polygons: SelectSequence[Polygon]):
        with self.from_db.bind_ctx([Polygon]):
            for polygon in polygons:
                polygon_data = model_to_dict(polygon, recurse=False)
                polygon_data["shape"] = self.shape_mapping[polygon_data["shape"]]

                with self.to_db.bind_ctx([Polygon]):
                    Polygon.create(**polygon_data)

    def migrate_rect(self, rects: SelectSequence[Rect]):
        with self.from_db.bind_ctx([Rect]):
            for rect in rects:
                rect_data = model_to_dict(rect, recurse=False)
                rect_data["shape"] = self.shape_mapping[rect_data["shape"]]

                with self.to_db.bind_ctx([Rect]):
                    Rect.create(**rect_data)

    def migrate_text(self, texts: SelectSequence[Text]):
        with self.from_db.bind_ctx([Text]):
            for text in texts:
                text_data = model_to_dict(text, recurse=False)
                text_data["shape"] = self.shape_mapping[text_data["shape"]]

                with self.to_db.bind_ctx([Text]):
                    Text.create(**text_data)

    def migrate_togglecomposite(
        self, togglecomposites: SelectSequence[ToggleComposite]
    ):
        with self.from_db.bind_ctx([ToggleComposite]):
            for togglecomposite in togglecomposites:
                togglecomposite_data = model_to_dict(togglecomposite, recurse=False)
                togglecomposite_data["shape"] = self.shape_mapping[
                    togglecomposite_data["shape"]
                ]
                togglecomposite_data["active_variant"] = self.shape_mapping[
                    togglecomposite_data["active_variant"]
                ]

                with self.to_db.bind_ctx([ToggleComposite]):
                    ToggleComposite.create(**togglecomposite_data)

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
                marker_data["shape"] = self.shape_mapping.get(marker_data["shape"])
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
        with self.from_db.bind_ctx([Note]):
            for note in Note.filter(room=room):
                note_data = model_to_dict(note, recurse=False)
                new_uuid = uuid.uuid4()
                self.note_mapping[note_data["uuid"]] = new_uuid
                note_data["uuid"] = new_uuid
                note_data["room"] = self.room_mapping[room.id]
                note_data["user"] = self.user_mapping.get(note_data["user"])
                if note_data["user"] is None:
                    continue
                if note_data["location"]:
                    note_data["location"] = self.location_mapping[note_data["location"]]

                with self.to_db.bind_ctx([Note]):
                    Note.create(**note_data)
