import os
import secrets
from pathlib import Path
import tarfile
from time import time
from typing import Dict, List, Optional, Set, cast
from playhouse.shortcuts import model_to_dict

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
from models.db import open_db
from models.general import Constants
from models.groups import Group
from models.initiative import Initiative
from models.label import LabelSelection
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
from models.user import User, UserOptions
from save import SAVE_VERSION


async def export_campaign(room: Room):
    CampaignExporter(room).pack()


class CampaignExporter:
    def __init__(self, room: Room) -> None:
        self.room = room

        self.user_mapping: Dict[int, int] = {}
        self.asset_mapping: Dict[int, int] = {}
        self.location_mapping: Dict[int, int] = {}
        self.layer_mapping: Dict[int, int] = {}
        self.groups_exported: Set[str] = set()

        self.generate_empty_db()
        self.export_users()
        self.export_room()
        self.export_label_selections()
        self.export_locations()
        self.export_players()
        self.export_notes()

    def generate_empty_db(self):
        static_folder = Path("static")
        self.output_folder = static_folder / "temp"
        os.makedirs(self.output_folder, exist_ok=True)
        self.filename = f"{self.room.name}-{self.room.creator.name}"
        self.sqlite_name = f"{self.filename}.sqlite"
        self.sqlite_path = self.output_folder / self.sqlite_name
        if self.sqlite_path.exists():
            os.remove(self.sqlite_path)

        self.db = open_db(self.sqlite_path)
        self.db.foreign_keys = False

        # Base model creation
        with self.db.bind_ctx(ALL_MODELS):
            self.db.create_tables(ALL_MODELS)
            # Generate constants (generate new set of tokens to prevent leaking server tokens)
            Constants.create(
                save_version=SAVE_VERSION,
                secret_token=secrets.token_bytes(32),
                api_token=secrets.token_hex(32),
            )

    def pack(self):
        self.db.close()

        static_folder = Path("static")
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

            for asset_id in self.asset_mapping.keys():
                asset: Asset = Asset[asset_id]
                if not asset.file_hash:
                    continue
                try:
                    file_path = static_folder / "assets" / asset.file_hash
                    info = tar.gettarinfo(str(file_path))
                    info.name = f"assets/{asset.file_hash}"
                    info.mtime = time()  # type: ignore
                    info.mode = 0o755
                    tar.addfile(info, open(file_path, "rb"))  # type: ignore
                except FileNotFoundError:
                    pass

        return tarpath, tarname

    def export_users(self):
        for player_room in self.room.players:
            user = cast(User, player_room.player)
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
                self.user_mapping[user.id] = new_user.id

            self.export_labels(new_user.id, user.labels)

    def export_labels(self, user_id: int, labels: List[Label]):
        for label in labels:
            label_data = model_to_dict(label, recurse=False)
            label_data["user"] = user_id

            with self.db.bind_ctx([Label]):
                Label.create(**label_data)

    def export_label_selections(self):
        for label_selection in LabelSelection.filter(room=self.room):
            label_selection_data = model_to_dict(label_selection, recurse=False)
            del label_selection_data["id"]
            label_selection_data["user"] = self.user_mapping[
                label_selection_data["user"]
            ]
            label_selection_data["room"] = self.new_room

            with self.db.bind_ctx([LabelSelection]):
                LabelSelection.create(**label_selection_data)

    def export_room(self):
        room_data = model_to_dict(self.room, recurse=False)
        room_options_data = model_to_dict(self.room.default_options, recurse=False)
        del room_data["id"]
        del room_options_data["id"]
        room_data["creator"] = self.user_mapping[room_data["creator"]]
        room_data["logo"] = self.export_asset(room_data["logo"])

        with self.db.bind_ctx([Room, LocationOptions]):
            lo = LocationOptions.create(**room_options_data)
            room_data["default_options"] = lo
            self.new_room = Room.create(**room_data)

    def export_locations(self):
        for location in self.room.locations:
            print(f"[LOC] {location.name}")
            location_data = model_to_dict(location, recurse=False)
            del location_data["id"]
            location_data["room"] = self.new_room

            location_options_data = None
            if location.options:
                location_options_data = model_to_dict(location.options, recurse=False)
                del location_options_data["id"]

            # signals trigger on this, so to be sure we bind extra
            with self.db.bind_ctx([Location, LocationOptions, PlayerRoom, Room, User]):
                if location_options_data:
                    lo = LocationOptions.create(**location_options_data)
                    location_data["options"] = lo
                new_location = Location.create(**location_data)
                self.location_mapping[location.id] = new_location.id

            self.export_floors(new_location.id, location.floors)
            if len(location.initiative) > 0:
                self.export_initiative(new_location.id, location.initiative[0])

            self.export_location_user_options(new_location.id, location.user_options)

    def export_location_user_options(
        self, location_id: int, user_options: List[LocationUserOption]
    ):
        for user_option in user_options:
            user_option_data = model_to_dict(user_option, recurse=False)

            user = self.user_mapping[user_option_data["user"]]

            del user_option_data["id"]
            user_option_data["location"] = location_id
            user_option_data["user"] = user
            if user_option_data["active_layer"]:
                user_option_data["active_layer"] = self.layer_mapping[
                    user_option_data["active_layer"]
                ]

            with self.db.bind_ctx([LocationUserOption]):
                q = LocationUserOption.select().where(
                    (LocationUserOption.location == location_id)
                    & (LocationUserOption.user == user)
                )
                if q.exists():
                    q[0].update(**user_option_data).where(
                        (LocationUserOption.location == location_id)
                        & (LocationUserOption.user == user)
                    ).execute()
                else:
                    LocationUserOption.create(**user_option_data)

    def export_initiative(self, location_id: int, initiative: Initiative):
        initiative_data = model_to_dict(initiative, recurse=False)
        del initiative_data["id"]
        initiative_data["location"] = location_id

        with self.db.bind_ctx([Initiative]):
            Initiative.create(**initiative_data)

    def export_players(self):
        for player_room in self.room.players:
            player_data = model_to_dict(player_room, recurse=False)
            del player_data["id"]

            player_options_data = None
            if player_room.user_options:
                player_options_data = model_to_dict(
                    player_room.user_options, recurse=False
                )
                del player_options_data["id"]

            player_data["room"] = self.new_room
            player_data["player"] = self.user_mapping[player_data["player"]]
            player_data["active_location"] = self.location_mapping[
                player_data["active_location"]
            ]

            with self.db.bind_ctx([PlayerRoom, UserOptions]):
                if player_options_data:
                    uo = UserOptions.create(**player_options_data)
                    player_data["user_options"] = uo
                PlayerRoom.create(**player_data)

    def export_notes(self):
        for note in Note.filter(room=self.room):
            note_data = model_to_dict(note, recurse=False)
            del note_data["id"]
            note_data["room"] = self.new_room
            note_data["user"] = self.user_mapping[note_data["user"]]
            if note_data["location"]:
                note_data["location"] = self.location_mapping[note_data["location"]]

            with self.db.bind_ctx([Note]):
                Note.create(**note_data)

    def export_floors(self, location_id: int, floors: List[Floor]):
        for floor in floors:
            print(f" [FL] {floor.name}")
            floor_data = model_to_dict(floor, recurse=False)
            del floor_data["id"]
            floor_data["location"] = location_id

            with self.db.bind_ctx([Floor]):
                new_floor = Floor.create(**floor_data)

            self.export_layers(new_floor.id, floor.layers)

    def export_layers(self, floor_id: int, layers: List[Layer]):
        for layer in layers:
            print(f"  [LAY] {layer.name}")
            layer_data = model_to_dict(layer, recurse=False)
            del layer_data["id"]
            layer_data["floor"] = floor_id

            with self.db.bind_ctx([Layer]):
                new_layer = Layer.create(**layer_data)
                self.layer_mapping[layer.id] = new_layer.id

            self.export_shapes(new_layer.id, layer.shapes)

    def export_shapes(self, layer_id: int, shapes: List[Shape]):
        for shape in shapes:
            shape_data = model_to_dict(shape, recurse=False)
            shape_data["layer"] = layer_id
            if shape_data["asset"]:
                shape_data["asset"] = self.export_asset(shape_data["asset"])
            if shape_data["group"]:
                self.export_group(shape_data["group"])

            with self.db.bind_ctx([Shape]):
                Shape.create(**shape_data)

            self.export_shape_labels(shape.labels)
            self.export_trackers(shape.trackers)
            self.export_auras(shape.auras)
            self.export_shape_owners(shape.owners)
            self.export_assetrect(shape.assetrect_set)
            self.export_circle(shape.circle_set)
            self.export_circulartoken(shape.circulartoken_set)
            self.export_line(shape.line_set)
            self.export_polygon(shape.polygon_set)
            self.export_rect(shape.rect_set)
            self.export_text(shape.text_set)
            self.export_togglecomposite(shape.togglecomposite_set)
            self.export_composite_shape_associations(shape.shape_variants)

    def export_composite_shape_associations(
        self, associations: List[CompositeShapeAssociation]
    ):
        for association in associations:
            association_data = model_to_dict(association, recurse=False)
            del association_data["id"]

            with self.db.bind_ctx([CompositeShapeAssociation]):
                CompositeShapeAssociation.create(**association_data)

    def export_assetrect(self, rects: List[AssetRect]):
        for rect in rects:
            rect_data = model_to_dict(rect, recurse=False)

            with self.db.bind_ctx([AssetRect]):
                AssetRect.create(**rect_data)

    def export_circle(self, circles: List[Circle]):
        for circle in circles:
            circle_data = model_to_dict(circle, recurse=False)

            with self.db.bind_ctx([Circle]):
                Circle.create(**circle_data)

    def export_circulartoken(self, circulartokens: List[CircularToken]):
        for circulartoken in circulartokens:
            circulartoken_data = model_to_dict(circulartoken, recurse=False)

            with self.db.bind_ctx([CircularToken]):
                CircularToken.create(**circulartoken_data)

    def export_line(self, lines: List[Line]):
        for line in lines:
            line_data = model_to_dict(line, recurse=False)

            with self.db.bind_ctx([Line]):
                Line.create(**line_data)

    def export_polygon(self, polygons: List[Polygon]):
        for polygon in polygons:
            polygon_data = model_to_dict(polygon, recurse=False)

            with self.db.bind_ctx([Polygon]):
                Polygon.create(**polygon_data)

    def export_rect(self, rects: List[Rect]):
        for rect in rects:
            rect_data = model_to_dict(rect, recurse=False)

            with self.db.bind_ctx([Rect]):
                Rect.create(**rect_data)

    def export_text(self, texts: List[Text]):
        for text in texts:
            text_data = model_to_dict(text, recurse=False)

            with self.db.bind_ctx([Text]):
                Text.create(**text_data)

    def export_togglecomposite(self, togglecomposites: List[ToggleComposite]):
        for togglecomposite in togglecomposites:
            togglecomposite_data = model_to_dict(togglecomposite, recurse=False)

            with self.db.bind_ctx([ToggleComposite]):
                ToggleComposite.create(**togglecomposite_data)

    def export_trackers(self, trackers: List[Tracker]):
        for tracker in trackers:
            tracker_data = model_to_dict(tracker, recurse=False)

            with self.db.bind_ctx([Tracker]):
                Tracker.create(**tracker_data)

    def export_auras(self, auras: List[Aura]):
        for aura in auras:
            aura_data = model_to_dict(aura, recurse=False)

            with self.db.bind_ctx([Aura]):
                Aura.create(**aura_data)

    def export_shape_owners(self, owners: List[ShapeOwner]):
        for owner in owners:
            owner_data = model_to_dict(owner, recurse=False)
            del owner_data["id"]
            owner_data["user"] = self.user_mapping[owner_data["user"]]

            with self.db.bind_ctx([ShapeOwner]):
                ShapeOwner.create(**owner_data)

    def export_shape_labels(self, labels: List[ShapeLabel]):
        for label in labels:
            label_data = model_to_dict(label, recurse=False)
            del label_data["id"]

            with self.db.bind_ctx([ShapeLabel]):
                ShapeLabel.create(**label_data)

    def export_group(self, group_id: str):
        if group_id in self.groups_exported:
            return

        group = Group[group_id]
        group_data = model_to_dict(group, recurse=False)

        with self.db.bind_ctx([Group]):
            Group.create(**group_data)

        self.groups_exported.add(group_id)

    def export_asset(self, asset_id: int) -> Optional[int]:
        if asset_id in self.asset_mapping:
            return self.asset_mapping[asset_id]

        try:
            asset: Asset = Asset[asset_id]
        except Asset.DoesNotExist:
            return None

        asset_data = model_to_dict(asset, recurse=False)
        del asset_data["id"]
        asset_data["owner"] = self.user_mapping[asset_data["owner"]]

        if asset.parent is not None:
            self.export_asset(asset_data["parent"])
            asset_data["parent"] = self.asset_mapping[asset_data["parent"]]

        with self.db.bind_ctx([Asset]):
            asset = Asset.create(**asset_data)
            self.asset_mapping[asset_id] = asset.id
        return asset.id
