# ruff: noqa
"""
This file is responsible for migrating old save files to new versions.

The `SAVE_VERSION` listed below lists the active save file format.

IMPORTANT:
When writing migrations make sure that these things are respected:
- Prefer raw sql over orm methods as these can lead to issues when you're multiple versions behind.
- Some column names clash with some sql keywords (e.g. 'index', 'group'), make sure that these are handled correctly
    - i.e. surround them at all times with quotes.
    - WHEN USING THIS IN A SELECT STATEMENT MAKE SURE YOU USE " AND NOT ' OR YOU WILL HAVE A STRING LITERAL
- When changing models that have inherited parents or children also update those with queries
    - e.g. a column added to Circle also needs to be added to CircularToken
- It's often a good idea to start the server with a clean save and use `.schema <table_name>` in sqlite to get the exact schema output that a clean save creates
"""

SAVE_VERSION = 115

import asyncio
import json
import secrets
import shutil
import sys
from datetime import datetime
from uuid import uuid4

from playhouse.sqlite_ext import SqliteExtDatabase

from .db.all import ALL_NORMAL_MODELS, ALL_VIEWS
from .db.db import db as ACTIVE_DB
from .db.models.constants import Constants
from .thumbnail import generate_thumbnail_for_asset
from .utils import ASSETS_DIR, FILE_DIR, SAVE_PATH, OldVersionException, UnknownVersionException, get_asset_hash_subpath
from .logs import logger


def get_save_version(db: SqliteExtDatabase):
    return db.execute_sql("SELECT save_version FROM constants").fetchone()[0]


def inc_save_version(db: SqliteExtDatabase):
    db.execute_sql("UPDATE constants SET save_version = save_version + 1")


def create_new_db(db: SqliteExtDatabase, version: int):
    db.create_tables(ALL_NORMAL_MODELS)
    for view in ALL_VIEWS:
        view.create_view(db)
    Constants.create(
        save_version=version,
        secret_token=secrets.token_bytes(32),
        api_token=secrets.token_hex(32),
    )


def check_existence() -> bool:
    if not SAVE_PATH.exists():
        logger.warning("Provided save file does not exist.  Creating a new one.")
        create_new_db(ACTIVE_DB, SAVE_VERSION)
        return True
    return False


def upgrade(
    db: SqliteExtDatabase,
    version: int,
    is_import: bool,
    loop: asyncio.AbstractEventLoop | None = None,
):
    if version < 94:
        raise OldVersionException(
            f"Upgrade code for this version is >2 years old and is no longer in the active codebase to reduce clutter. You can still find this code on github, contact me for more info."
        )

    db.foreign_keys = False

    if version == 94:
        # Add Room.enable_chat Room.enable_dice
        with db.atomic():
            db.execute_sql("ALTER TABLE room ADD COLUMN enable_chat INTEGER NOT NULL DEFAULT 1")
            db.execute_sql("ALTER TABLE room ADD COLUMN enable_dice INTEGER NOT NULL DEFAULT 1")
    elif version == 95:
        # Remove labels
        with db.atomic():
            db.execute_sql("DROP TABLE shape_label")
            db.execute_sql("DROP TABLE label_selection")
            db.execute_sql("DROP TABLE label")
    elif version == 96:
        # Add UserOptions.default_wall_colour, UserOptions.default_window_colour, UserOptions.default_closed_door_colour, UserOptions.default_open_door_colour
        with db.atomic():
            db.execute_sql("ALTER TABLE user_options ADD COLUMN default_wall_colour TEXT DEFAULT NULL")
            db.execute_sql("ALTER TABLE user_options ADD COLUMN default_window_colour TEXT DEFAULT NULL")
            db.execute_sql("ALTER TABLE user_options ADD COLUMN default_closed_door_colour TEXT DEFAULT NULL")
            db.execute_sql("ALTER TABLE user_options ADD COLUMN default_open_door_colour TEXT DEFAULT NULL")
    elif version == 97:
        # Add folder structure to the assets folder

        # 1 first copy the physical files to their new location
        if not is_import:
            migrate_assets_folder()

        # 2 update asset shapes in the DB
        with db.atomic():
            asset_data = db.execute_sql("SELECT shape_id, src FROM asset_rect")
            for shape_id, src in asset_data.fetchall():
                # Regular assets - Grab the file hash
                # We doe a split, because some legacy assets start with http://
                if "/static/assets/" in src:
                    file_hash = src.split("/static/assets/")[1]
                    new_path = f"/static/assets/{get_asset_hash_subpath(file_hash)}"

                    db.execute_sql(
                        "UPDATE asset_rect SET src=? WHERE shape_id=?",
                        (new_path, shape_id),
                    )

        # 3 Delete the old files
        if not is_import:
            remove_old_assets()
    elif version == 98:
        # Generate thumbnails for all assets
        # This is a bit of a fake migration as the DB is not modified, but it's a one time thing
        if not is_import and loop is not None:
            asset_data = db.execute_sql("SELECT name, file_hash FROM asset WHERE file_hash NOT NULL").fetchall()

            loop.create_task(generate_thumbnails(asset_data, loop))
    elif version == 99:
        # Add AssetShortcut
        with db.atomic():
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS asset_shortcut (id INTEGER NOT NULL PRIMARY KEY, asset_id INTEGER NOT NULL, player_room_id INTEGER NOT NULL, FOREIGN KEY (asset_id) REFERENCES asset (id) ON DELETE CASCADE, FOREIGN KEY (player_room_id) REFERENCES player_room (id) ON DELETE CASCADE)"
            )
    elif version == 100:
        # Remove Shape.isToken & Unset vision_access for shapes that are not tokens
        with db.atomic():
            asset_data = db.execute_sql(
                "SELECT so.id FROM shape_owner so INNER JOIN shape s ON s.uuid = so.shape_id WHERE s.is_token = 0 AND so.vision_access = 1"
            )
            for id in asset_data.fetchall():
                db.execute_sql("UPDATE shape_owner SET vision_access=0 WHERE id=?", id)
            db.execute_sql("CREATE TEMPORARY TABLE _shape_100 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, "is_invisible" INTEGER NOT NULL DEFAULT 0, "is_defeated" INTEGER NOT NULL DEFAULT 0, "default_movement_access" INTEGER NOT NULL DEFAULT 0, "is_locked" INTEGER NOT NULL DEFAULT 0, "angle" REAL NOT NULL DEFAULT 0, "stroke_width" INTEGER NOT NULL DEFAULT 2, "asset_id" INTEGER DEFAULT NULL, "group_id" TEXT DEFAULT NULL, "ignore_zoom_size" INTEGER DEFAULT 0, "is_door" INTEGER DEFAULT 0 NOT NULL, "is_teleport_zone" INTEGER DEFAULT 0 NOT NULL, "character_id" INTEGER DEFAULT NULL, odd_hex_orientation INTEGER DEFAULT 0, size INTEGER DEFAULT 0, show_cells INTEGER NOT NULL DEFAULT 0, cell_fill_colour TEXT DEFAULT NULL, cell_stroke_colour TEXT DEFAULT NULL, cell_stroke_width INTEGER DEFAULT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE SET NULL, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL)'
            )
            db.execute_sql(
                'INSERT INTO "shape" ("uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width") SELECT "uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width" FROM _shape_100'
            )
            db.execute_sql("DROP TABLE _shape_100")
    elif version == 101:
        # Add Mods and ModsPlayerRoom
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "mod" ("id" INTEGER NOT NULL PRIMARY KEY, "tag" TEXT NOT NULL, "name" TEXT NOT NULL, "version" TEXT NOT NULL, "hash" TEXT NOT NULL, "author" TEXT NOT NULL, "description" TEXT NOT NULL, "short_description" TEXT NOT NULL, "api_schema" TEXT NOT NULL, "first_uploaded_at" DATE NOT NULL, "first_uploaded_by_id" INTEGER, "has_css" INTEGER NOT NULL, FOREIGN KEY ("first_uploaded_by_id") REFERENCES "user" ("id") ON DELETE SET NULL);'
            )
            db.execute_sql('CREATE INDEX "mod_first_uploaded_by_id" ON "mod" ("first_uploaded_by_id");')
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "mod_room" ("id" INTEGER NOT NULL PRIMARY KEY, "mod_id" INTEGER NOT NULL, "room_id" INTEGER NOT NULL, "enabled" INTEGER NOT NULL, FOREIGN KEY ("mod_id") REFERENCES "mod" ("id") ON DELETE CASCADE, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE);'
            )
            db.execute_sql('CREATE INDEX "mod_room_mod_id" ON "mod_room" ("mod_id");')
            db.execute_sql('CREATE INDEX "mod_room_room_id" ON "mod_room" ("room_id");')
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "mod_player_room" ("id" INTEGER NOT NULL PRIMARY KEY, "mod_id" INTEGER NOT NULL, "player_room_id" INTEGER NOT NULL, "enabled" INTEGER NOT NULL, FOREIGN KEY ("mod_id") REFERENCES "mod" ("id") ON DELETE CASCADE, FOREIGN KEY ("player_room_id") REFERENCES "player_room" ("id") ON DELETE CASCADE);'
            )
            db.execute_sql('CREATE INDEX "mod_player_room_mod_id" ON "mod_player_room" ("mod_id");')
            db.execute_sql('CREATE INDEX "mod_player_room_player_room_id" ON "mod_player_room" ("player_room_id");')
    elif version == 102:
        with db.atomic():
            db.execute_sql("CREATE UNIQUE INDEX unique_username ON user(name);")
    elif version == 103:
        with db.atomic():
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS stats (id INTEGER NOT NULL PRIMARY KEY, kind TEXT NOT NULL, timestamp DATETIME NOT NULL, data TEXT);"
            )
            db.execute_sql(
                "ALTER TABLE constants ADD COLUMN stats_uuid TEXT;",
            )
            db.execute_sql("ALTER TABLE constants ADD COLUMN last_export_date DATETIME;")
            db.execute_sql(
                "UPDATE constants SET stats_uuid = ?",
                (str(uuid4()),),
            )
    elif version == 104:
        with db.atomic():
            # Add room_id and user_id to stats for better querying
            db.execute_sql("ALTER TABLE stats ADD COLUMN campaign_id INTEGER DEFAULT NULL")
            db.execute_sql("ALTER TABLE stats ADD COLUMN user_id INTEGER DEFAULT NULL")

            # Remove spammy connection stats flooding the db && move stats data to new columns
            stats = db.execute_sql("SELECT id, kind, timestamp, data FROM stats").fetchall()
            last_known_connections = {}
            for id, kind, timestamp, asset_data in stats:
                if kind == "StatsKind.USER_GAME_CONNECTED":
                    try:
                        json_data = json.loads(asset_data)
                    except:
                        continue
                    last_known_connections[(json_data["playerId"], json_data["campaignId"])] = (
                        datetime.fromisoformat(timestamp),
                        id,
                    )
                elif kind == "StatsKind.USER_GAME_DISCONNECTED":
                    try:
                        json_data = json.loads(asset_data)
                    except:
                        continue
                    key = (json_data["playerId"], json_data["campaignId"])
                    if key in last_known_connections:
                        delta = datetime.fromisoformat(timestamp) - last_known_connections[key][0]
                        if delta.total_seconds() < 60:
                            db.execute_sql("DELETE FROM stats WHERE id=?", (last_known_connections[key][1],))
                            db.execute_sql("DELETE FROM stats WHERE id=?", (id,))
                        del last_known_connections[key]
                        continue
                if asset_data:
                    try:
                        json_data = json.loads(asset_data)
                    except:
                        continue
                    db.execute_sql(
                        "UPDATE stats SET campaign_id=?, user_id=?, data=? WHERE id=?",
                        (json_data.get("campaignId"), json_data.get("userId"), None, id),
                    )
    elif version == 105:
        # Add User.last_login
        with db.atomic():
            db.execute_sql("ALTER TABLE user ADD COLUMN last_login DATE DEFAULT NULL")
    elif version == 106:
        # Add ShapeCustomData
        with db.atomic():
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS 'shape_custom_data' ('id' INTEGER NOT NULL PRIMARY KEY, 'shape_id' TEXT NOT NULL, 'source' TEXT NOT NULL, 'prefix' TEXT NOT NULL, 'name' TEXT NOT NULL, 'kind' TEXT NOT NULL, 'value' TEXT NOT NULL, 'reference' TEXT DEFAULT NULL, 'description' TEXT DEFAULT NULL, FOREIGN KEY ('shape_id') REFERENCES 'shape' ('uuid') ON DELETE CASCADE)"
            )
            db.execute_sql(
                "CREATE UNIQUE INDEX 'shape_custom_data_keys' ON 'shape_custom_data' ('shape_id', 'source', 'prefix', 'name')"
            )
    elif version == 107:
        with db.atomic():
            # Fix Shape default values missing
            db.execute_sql("CREATE TEMPORARY TABLE _shape_107 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL DEFAULT 0, "fill_colour" TEXT NOT NULL DEFAULT "#000", "stroke_colour" TEXT NOT NULL DEFAULT "#fff", "vision_obstruction" INTEGER NOT NULL DEFAULT 0, "movement_obstruction" INTEGER NOT NULL DEFAULT 0, "draw_operator" TEXT NOT NULL DEFAULT "source-over", "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL DEFAULT 1, "show_badge" INTEGER NOT NULL DEFAULT 0, "default_edit_access" INTEGER NOT NULL DEFAULT 0, "default_vision_access" INTEGER NOT NULL DEFAULT 0, "is_invisible" INTEGER NOT NULL DEFAULT 0, "is_defeated" INTEGER NOT NULL DEFAULT 0, "default_movement_access" INTEGER NOT NULL DEFAULT 0, "is_locked" INTEGER NOT NULL DEFAULT 0, "angle" REAL NOT NULL DEFAULT 0, "stroke_width" INTEGER NOT NULL DEFAULT 2, "asset_id" INTEGER DEFAULT NULL, "group_id" TEXT DEFAULT NULL, "ignore_zoom_size" INTEGER DEFAULT 0, "is_door" INTEGER DEFAULT 0 NOT NULL, "is_teleport_zone" INTEGER DEFAULT 0 NOT NULL, "character_id" INTEGER DEFAULT NULL, odd_hex_orientation INTEGER DEFAULT 0, size INTEGER DEFAULT 0, show_cells INTEGER NOT NULL DEFAULT 0, cell_fill_colour TEXT DEFAULT NULL, cell_stroke_colour TEXT DEFAULT NULL, cell_stroke_width INTEGER DEFAULT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE SET NULL, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL)'
            )
            db.execute_sql("CREATE INDEX 'shape_layer_id' ON 'shape' ('layer_id')")
            db.execute_sql("CREATE INDEX 'shape_asset_id' ON 'shape' ('asset_id')")
            db.execute_sql("CREATE INDEX 'shape_group_id' ON 'shape' ('group_id')")
            db.execute_sql("CREATE INDEX 'shape_character_id' ON 'shape' ('character_id')")
            db.execute_sql(
                'INSERT INTO "shape" ("uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width") SELECT "uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width" FROM _shape_107'
            )
            db.execute_sql("DROP TABLE _shape_107")

            # Add AssetTemplate
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS 'shape_template' ('id' INTEGER NOT NULL PRIMARY KEY, 'shape_id' TEXT NOT NULL, 'asset_id' INTEGER NOT NULL, 'name' TEXT NOT NULL, FOREIGN KEY ('shape_id') REFERENCES 'shape' ('uuid') ON DELETE CASCADE, FOREIGN KEY ('asset_id') REFERENCES 'asset' ('id') ON DELETE CASCADE)"
            )
            db.execute_sql("CREATE INDEX 'shape_template_shape_id' ON 'shape_template' ('shape_id')")
            db.execute_sql("CREATE INDEX 'shape_template_asset_id' ON 'shape_template' ('asset_id')")

            # Migrate old templates
            asset_data = db.execute_sql(
                "SELECT a.id, a.owner_id, a.options FROM asset a WHERE a.options IS NOT NULL"
            ).fetchall()
            asset_id_to_note_id = {}
            for asset_id, asset_owner, raw_options in asset_data:
                try:
                    asset_options = json.loads(raw_options)
                    templates = asset_options["templates"]
                except:
                    continue
                for template_name, template_values in templates.items():
                    if template_values.get("type_") != "assetrect":
                        continue

                    try:
                        new_shape_id = str(uuid4())
                        db.execute_sql(
                            'INSERT INTO "shape" ("uuid", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "index", "default_edit_access", "default_vision_access", "default_movement_access", "angle", "stroke_width", "asset_id") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            (
                                new_shape_id,
                                "assetrect",
                                0,
                                0,
                                template_values.get("name", None),
                                template_values.get("name_visible", False),
                                template_values.get("fill_colour", "#000"),
                                template_values.get("stroke_colour", "#fff"),
                                template_values.get("vision_obstruction", False),
                                template_values.get("movement_obstruction", False),
                                0,
                                template_values.get("default_edit_access", False),
                                template_values.get("default_vision_access", False),
                                template_values.get("default_movement_access", False),
                                template_values.get("angle", 0),
                                template_values.get("stroke_width", 2),
                                asset_id,
                            ),
                        )
                        src = template_values.get("src", "")
                        if "/static/assets/" in src:
                            file_hash = src.split("/static/assets/")[1]
                            src = f"/static/assets/{get_asset_hash_subpath(file_hash)}"
                        db.execute_sql(
                            'INSERT INTO "asset_rect" ("shape_id", "src", "width", "height") VALUES (?, ?, ?, ?)',
                            (
                                new_shape_id,
                                src,
                                template_values.get("width", 0),
                                template_values.get("height", 0),
                            ),
                        )
                        db.execute_sql(
                            "INSERT INTO 'shape_template' ('shape_id', 'asset_id', 'name') VALUES (?, ?, ?)",
                            (new_shape_id, asset_id, template_name),
                        )
                        # insert trackers
                        trackers = template_values.get("trackers", [])
                        for tracker in trackers:
                            db.execute_sql(
                                "INSERT INTO 'tracker' ('uuid', 'shape_id', 'visible', 'name', 'value', 'maxvalue', 'draw', 'primary_color', 'secondary_color') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                (
                                    str(uuid4()),
                                    new_shape_id,
                                    tracker.get("visible", False),
                                    tracker.get("name", ""),
                                    tracker.get("value", 0),
                                    tracker.get("maxvalue", 0),
                                    tracker.get("draw", False),
                                    tracker.get("primary_color", "#000000"),
                                    tracker.get("secondary_color", "#000000"),
                                ),
                            )
                        # insert auras
                        auras = template_values.get("auras", [])
                        for aura in auras:
                            db.execute_sql(
                                "INSERT INTO 'aura' ('uuid', 'shape_id', 'vision_source', 'visible', 'name', 'value', 'dim', 'colour', 'active', 'border_colour', 'angle', 'direction') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                (
                                    str(uuid4()),
                                    new_shape_id,
                                    aura.get("vision_source", False),
                                    aura.get("visible", False),
                                    aura.get("name", ""),
                                    aura.get("value", 0),
                                    aura.get("dim", 0),
                                    aura.get("colour", "#000000"),
                                    aura.get("active", False),
                                    aura.get("border_colour", "#000000"),
                                    aura.get("angle", 0),
                                    aura.get("direction", 0),
                                ),
                            )
                        # attach notes
                        try:
                            notes_data = json.loads(template_values.get("options", "[]"))
                            notes = {k: v for k, v in notes_data.items() if k == "templateNoteIds"}.get(
                                "templateNoteIds", []
                            )
                        except:
                            pass
                        else:
                            for note_id in notes:
                                note_query = db.execute_sql("SELECT id FROM note WHERE uuid = ?", (note_id,))
                                if note_query.fetchone() is None:
                                    continue
                                db.execute_sql(
                                    "INSERT INTO 'note_shape' ('note_id', 'shape_id') VALUES (?, ?)",
                                    (note_id, new_shape_id),
                                )
                    except:
                        logger.exception(
                            f"Error migrating asset template {template_name} for asset {asset_id} - skipping"
                        )
            # remove Asset options
            db.execute_sql("CREATE TEMPORARY TABLE _asset_107 AS SELECT * FROM asset")
            db.execute_sql("DROP TABLE asset")
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS 'asset' ('id' INTEGER NOT NULL PRIMARY KEY, 'owner_id' INTEGER NOT NULL, 'parent_id' INTEGER, 'name' TEXT NOT NULL, 'file_hash' TEXT, FOREIGN KEY ('owner_id') REFERENCES 'user' ('id') ON DELETE CASCADE, FOREIGN KEY ('parent_id') REFERENCES 'asset' ('id') ON DELETE CASCADE)"
            )
            db.execute_sql("CREATE INDEX 'asset_owner_id' ON 'asset' ('owner_id')")
            db.execute_sql("CREATE INDEX 'asset_parent_id' ON 'asset' ('parent_id')")
            db.execute_sql(
                "INSERT INTO 'asset' ('id', 'owner_id', 'parent_id', 'name', 'file_hash') SELECT id, owner_id, parent_id, name, file_hash FROM _asset_107"
            )
            db.execute_sql("DROP TABLE _asset_107")
    elif version == 108:
        # Add NoteRoom and migrate Note to NoteRoom
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note_room" ("id" INTEGER NOT NULL PRIMARY KEY, "note_id" TEXT NOT NULL, "room_id" INTEGER NOT NULL, "location_id" INTEGER DEFAULT NULL, FOREIGN KEY ("note_id") REFERENCES "note" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "note_room_note_id" ON "note_room" ("note_id")')
            db.execute_sql('CREATE INDEX "note_room_room_id" ON "note_room" ("room_id")')
            db.execute_sql('CREATE INDEX "note_room_location_id" ON "note_room" ("location_id")')
            db.execute_sql(
                'CREATE UNIQUE INDEX "unique_note_room" ON "note_room" ("note_id", "room_id", "location_id")'
            )

            asset_data = db.execute_sql("SELECT uuid, location_id, room_id FROM note WHERE room_id IS NOT NULL")
            for note_id, location_id, room_id in asset_data.fetchall():
                db.execute_sql(
                    'INSERT INTO "note_room" ("note_id", "room_id", "location_id") VALUES (?, ?, ?)',
                    (note_id, room_id, location_id),
                )

            db.execute_sql("CREATE TEMPORARY TABLE _note_108 AS SELECT * FROM note")
            db.execute_sql("DROP TABLE note")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note" ("uuid" TEXT NOT NULL PRIMARY KEY, "creator_id" INTEGER NOT NULL, "title" TEXT NOT NULL DEFAULT \'\', "text" TEXT NOT NULL DEFAULT \'\', "tags" TEXT DEFAULT NULL, "show_on_hover" INT DEFAULT 0 NOT NULL, "show_icon_on_shape" INT DEFAULT 0 NOT NULL, FOREIGN KEY ("creator_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "note_creator_id" ON "note" ("creator_id")')
            db.execute_sql(
                'INSERT INTO "note" ("uuid", "creator_id", "title", "text", "tags", "show_on_hover", "show_icon_on_shape") SELECT uuid, creator_id, title, text, tags, show_on_hover, show_icon_on_shape FROM _note_108'
            )
            db.execute_sql("DROP TABLE _note_108")

            db.execute_sql(
                "CREATE VIEW IF NOT EXISTS shape_room_view AS SELECT shape.uuid as shape_id, room.id as room_id FROM shape LEFT JOIN layer ON shape.layer_id = layer.id INNER JOIN floor ON layer.floor_id = floor.id INNER JOIN location ON floor.location_id = location.id INNER JOIN room ON location.room_id = room.id"
            )
    elif version == 109:
        # Add NoteTag and NoteUserTag and remove tags column from note
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note_user_tag" ("id" INTEGER NOT NULL PRIMARY KEY, "user_id" INTEGER NOT NULL, "tag" TEXT NOT NULL, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "note_user_tag_user_id" ON "note_user_tag" ("user_id")')
            db.execute_sql('CREATE UNIQUE INDEX "unique_note_user_tag" ON "note_user_tag" ("user_id", "tag")')

            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note_tag" ("id" INTEGER NOT NULL PRIMARY KEY, "note_id" TEXT NOT NULL, "tag_id" INTEGER NOT NULL, FOREIGN KEY ("note_id") REFERENCES "note" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("tag_id") REFERENCES "note_user_tag" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "note_tag_note_id" ON "note_tag" ("note_id")')
            db.execute_sql('CREATE INDEX "note_tag_tag_id" ON "note_tag" ("tag_id")')
            db.execute_sql('CREATE UNIQUE INDEX "unique_note_tag" ON "note_tag" ("note_id", "tag_id")')
            asset_data = db.execute_sql("SELECT uuid, creator_id, tags FROM note WHERE tags IS NOT NULL")
            for note_id, creator_id, tags in asset_data.fetchall():
                try:
                    tags = json.loads(tags)
                except:
                    continue
                for tag in set(tags):
                    tag_query = db.execute_sql(
                        "SELECT id FROM note_user_tag WHERE user_id = ? AND tag = ?", (creator_id, tag)
                    )
                    result = tag_query.fetchone()
                    if result is None:
                        tag_query = db.execute_sql(
                            "INSERT INTO 'note_user_tag' ('user_id', 'tag') VALUES (?, ?) RETURNING id",
                            (creator_id, tag),
                        )
                        result = tag_query.fetchone()
                    tag_id = result[0]
                    db.execute_sql(
                        "INSERT INTO 'note_tag' ('note_id', 'tag_id') VALUES (?, ?)",
                        (note_id, tag_id),
                    )
            db.execute_sql("ALTER TABLE note DROP COLUMN tags")
    elif version == 110:
        # Add more columns to ShapeRoomView
        with db.atomic():
            db.execute_sql("DROP VIEW shape_room_view")
            db.execute_sql(
                "CREATE VIEW shape_room_view AS SELECT shape.uuid as shape_id, room.id as room_id, location.id as location_id FROM shape LEFT JOIN layer ON shape.layer_id = layer.id LEFT JOIN floor ON layer.floor_id = floor.id LEFT JOIN location ON floor.location_id = location.id LEFT JOIN room ON location.room_id = room.id"
            )
    elif version == 111:
        # Remove Shape.size and add Shape.size_x, Shape.size_y
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _shape_111 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL DEFAULT 0, "fill_colour" TEXT NOT NULL DEFAULT "#000", "stroke_colour" TEXT NOT NULL DEFAULT "#fff", "vision_obstruction" INTEGER NOT NULL DEFAULT 0, "movement_obstruction" INTEGER NOT NULL DEFAULT 0, "draw_operator" TEXT NOT NULL DEFAULT "source-over", "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL DEFAULT 1, "show_badge" INTEGER NOT NULL DEFAULT 0, "default_edit_access" INTEGER NOT NULL DEFAULT 0, "default_vision_access" INTEGER NOT NULL DEFAULT 0, "is_invisible" INTEGER NOT NULL DEFAULT 0, "is_defeated" INTEGER NOT NULL DEFAULT 0, "default_movement_access" INTEGER NOT NULL DEFAULT 0, "is_locked" INTEGER NOT NULL DEFAULT 0, "angle" REAL NOT NULL DEFAULT 0, "stroke_width" INTEGER NOT NULL DEFAULT 2, "asset_id" INTEGER DEFAULT NULL, "group_id" TEXT DEFAULT NULL, "ignore_zoom_size" INTEGER DEFAULT 0, "is_door" INTEGER DEFAULT 0 NOT NULL, "is_teleport_zone" INTEGER DEFAULT 0 NOT NULL, "character_id" INTEGER DEFAULT NULL, odd_hex_orientation INTEGER DEFAULT 0, size_x INTEGER DEFAULT 0, size_y INTEGER DEFAULT 0, show_cells INTEGER NOT NULL DEFAULT 0, cell_fill_colour TEXT DEFAULT NULL, cell_stroke_colour TEXT DEFAULT NULL, cell_stroke_width INTEGER DEFAULT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE SET NULL, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL)'
            )
            db.execute_sql("CREATE INDEX 'shape_layer_id' ON 'shape' ('layer_id')")
            db.execute_sql("CREATE INDEX 'shape_asset_id' ON 'shape' ('asset_id')")
            db.execute_sql("CREATE INDEX 'shape_group_id' ON 'shape' ('group_id')")
            db.execute_sql("CREATE INDEX 'shape_character_id' ON 'shape' ('character_id')")
            db.execute_sql(
                'INSERT INTO "shape" ("uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size_x", "size_y", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width") SELECT "uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "is_defeated", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_door", "is_teleport_zone", "character_id", "odd_hex_orientation", "size", "size", "show_cells", "cell_fill_colour", "cell_stroke_colour", "cell_stroke_width" FROM _shape_111'
            )
            db.execute_sql("DROP TABLE _shape_111")
    elif version == 112:
        # Change text font size from int to float
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _text_112 AS SELECT * FROM text")
            db.execute_sql("DROP TABLE text")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "text" ("shape_id" TEXT NOT NULL PRIMARY KEY, "text" TEXT NOT NULL, "font_size" REAL NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'INSERT INTO "text" ("shape_id", "text", "font_size") SELECT "shape_id", "text", "font_size" FROM _text_112'
            )
    elif version == 113:
        # Add updateTiming to initiative effects
        with db.atomic():
            rows = db.execute_sql("SELECT id, data FROM initiative").fetchall()
            for rowid, asset_data in rows:
                try:
                    json_data = json.loads(asset_data) if asset_data else {}
                except:
                    json_data = {}

                for entry in json_data:
                    for effect in entry["effects"]:
                        effect["updateTiming"] = 0
                data_text = json.dumps(json_data)
                db.execute_sql("UPDATE initiative SET data = ? WHERE id = ?", (data_text, rowid))
    elif version == 114:
        # Asset DB refactor
        with db.atomic():
            # STEP 1: ASSET TABLES

            asset_data = db.execute_sql("SELECT id, owner_id, file_hash, parent_id, name FROM asset").fetchall()

            db.execute_sql("CREATE TEMPORARY TABLE _asset_114 AS SELECT * FROM asset")
            db.execute_sql("DROP TABLE asset")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "asset" ("id" INTEGER NOT NULL PRIMARY KEY, "file_hash" TEXT NOT NULL)'
            )
            db.execute_sql('CREATE UNIQUE INDEX "asset_file_hash" ON "asset" ("file_hash")')
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "asset_entry" ("id" INTEGER NOT NULL PRIMARY KEY, "owner_id" INTEGER NOT NULL, "parent_id" INTEGER, "asset_id" INTEGER, "name" TEXT NOT NULL, FOREIGN KEY ("owner_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("parent_id") REFERENCES "asset_entry" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "asset_entry_owner_id" ON "asset_entry" ("owner_id")')
            db.execute_sql('CREATE INDEX "asset_entry_parent_id" ON "asset_entry" ("parent_id")')
            db.execute_sql('CREATE INDEX "asset_entry_asset_id" ON "asset_entry" ("asset_id")')

            file_map = {}  # file_hash -> { asset_id, entries: [(old_id, new_id)] }
            entry_map = {}  # old_id (Asset) -> (new AssetId, new AssetEntryId, owner_id)
            parent_patch = []  # (asset_needing_patch_id, old_parent_id), this is used to patch parent_id's for parents that aren't processed yet
            for _id, owner_id, file_hash, parent_id, name in asset_data:
                asset_id = None
                if file_hash:
                    if file_hash not in file_map:
                        query = db.execute_sql(
                            "INSERT INTO asset (file_hash) VALUES (?) RETURNING id",
                            (file_hash,),
                        )
                        asset_id = query.fetchone()[0]
                        file_map[file_hash] = {"asset_id": asset_id, "entries": []}

                    asset_id = file_map[file_hash]["asset_id"]

                # Drop extensions from asset entry names (skip folders)
                cleaned_name = name
                if file_hash and "." in name and len(name.split(".")[-1]) <= 4:
                    cleaned_name = ".".join(name.split(".")[:-1])

                new_parent_id = None
                if parent_id and parent_id in entry_map:
                    new_parent_id = entry_map[parent_id][1]

                query = db.execute_sql(
                    "INSERT INTO asset_entry (owner_id, parent_id, asset_id, name) VALUES (?, ?, ?, ?) RETURNING id",
                    (owner_id, new_parent_id, asset_id, cleaned_name),
                )
                entry_id = query.fetchone()[0]
                if file_hash:
                    file_map[file_hash]["entries"].append((_id, entry_id))
                entry_map[_id] = (asset_id, entry_id, owner_id)

                if file_hash and not new_parent_id:
                    parent_patch.append((entry_id, parent_id))

            for asset_needing_patch_id, old_parent_id in parent_patch:
                new_parent_id = entry_map[old_parent_id][1]
                db.execute_sql(
                    "UPDATE asset_entry SET parent_id = ? WHERE id = ?",
                    (new_parent_id, asset_needing_patch_id),
                )

            # STEP 2: SHAPE/ASSET_RECT TABLES

            shape_data = db.execute_sql(
                "SELECT s.uuid, ar.src, s.asset_id, ar.width, ar.height FROM asset_rect ar INNER JOIN shape s ON ar.shape_id = s.uuid"
            ).fetchall()
            db.execute_sql("DROP TABLE asset_rect")
            db.execute_sql("CREATE TEMPORARY TABLE _shape_114 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, "is_invisible" INTEGER NOT NULL, "is_defeated" INTEGER NOT NULL, "default_movement_access" INTEGER NOT NULL, "is_locked" INTEGER NOT NULL, "angle" REAL NOT NULL, "stroke_width" INTEGER NOT NULL, "group_id" TEXT, "ignore_zoom_size" INTEGER NOT NULL, "is_door" INTEGER NOT NULL, "is_teleport_zone" INTEGER NOT NULL, "character_id" INTEGER, "odd_hex_orientation" INTEGER NOT NULL, "size_x" INTEGER NOT NULL, "size_y" INTEGER NOT NULL, "show_cells" INTEGER NOT NULL, "cell_fill_colour" TEXT, "cell_stroke_colour" TEXT, "cell_stroke_width" INTEGER, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL)'
            )
            db.execute_sql('CREATE INDEX "shape_layer_id" ON "shape" ("layer_id")')
            db.execute_sql('CREATE INDEX "shape_group_id" ON "shape" ("group_id")')
            db.execute_sql('CREATE INDEX "shape_character_id" ON "shape" ("character_id")')
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, is_defeated, default_movement_access, is_locked, angle, stroke_width, group_id, ignore_zoom_size, is_door, is_teleport_zone, character_id, odd_hex_orientation, size_x, size_y, show_cells, cell_fill_colour, cell_stroke_colour, cell_stroke_width) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, is_defeated, default_movement_access, is_locked, angle, stroke_width, group_id, ignore_zoom_size, is_door, is_teleport_zone, character_id, odd_hex_orientation, size_x, size_y, show_cells, cell_fill_colour, cell_stroke_colour, cell_stroke_width FROM _shape_114'
            )
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "asset_rect" ("shape_id" TEXT NOT NULL PRIMARY KEY, "width" REAL NOT NULL, "height" REAL NOT NULL, "asset_id" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "asset_rect_asset_id" ON "asset_rect" ("asset_id")')

            for shape_id, src, asset_id, width, height in shape_data:
                src_hash = src.split("/")[-1]
                if src.endswith("spawn.png"):
                    # print("SKIPPING SPAWN SHAPE", shape_id)
                    continue
                if src_hash not in file_map:
                    # These are assets that for unknown reasons have a src but not a single asset with that src
                    # Our best bet is to just create a new asset pointing to that src
                    # The file may no longer exist, but that's not really an issue, it will just be empty in the game
                    # Which is probably better than just removing the shape
                    query = db.execute_sql(
                        "INSERT INTO asset (file_hash) VALUES (?) RETURNING id",
                        (src_hash,),
                    )
                    asset_id = query.fetchone()[0]
                    file_map[src_hash] = {"asset_id": asset_id, "entries": []}

                # This also fixes outdated asset_ids that were not updated when changing the src
                db.execute_sql(
                    "INSERT INTO asset_rect (shape_id, asset_id, width, height) VALUES (?, ?, ?, ?)",
                    (shape_id, file_map[src_hash]["asset_id"], width, height),
                )

            # STEP 3: MIGRATE ASSET SHARES

            asset_share_data = db.execute_sql(
                "SELECT asset_id, user_id, right, name, parent_id FROM asset_share"
            ).fetchall()
            db.execute_sql("DROP TABLE asset_share")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "asset_share" ("id" INTEGER NOT NULL PRIMARY KEY, "user_id" INTEGER NOT NULL, "right" TEXT NOT NULL, "name" TEXT NOT NULL, "entry_id" INTEGER NOT NULL, "parent_id" INTEGER NOT NULL, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "asset_share_user_id" ON "asset_share" ("user_id")')
            db.execute_sql('CREATE INDEX "asset_share_entry_id" ON "asset_share" ("entry_id")')
            db.execute_sql('CREATE INDEX "asset_share_parent_id" ON "asset_share" ("parent_id")')

            for asset_id, user_id, right, name, parent_id in asset_share_data:
                db.execute_sql(
                    "INSERT INTO asset_share (user_id, right, name, entry_id, parent_id) VALUES (?, ?, ?, ?, ?)",
                    (user_id, right, name, entry_map[asset_id][1], entry_map[parent_id][1] if parent_id else None),
                )

            # STEP 4: MIGRATE SHAPE TEMPLATES

            shape_template_data = db.execute_sql("SELECT shape_id, asset_id, name FROM shape_template").fetchall()
            db.execute_sql("DROP TABLE shape_template")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape_template" ("id" INTEGER NOT NULL PRIMARY KEY, "owner_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "shape_id" TEXT NOT NULL, "asset_id" INTEGER NOT NULL, FOREIGN KEY ("owner_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "shape_template_owner_id" ON "shape_template" ("owner_id")')
            db.execute_sql('CREATE INDEX "shape_template_shape_id" ON "shape_template" ("shape_id")')
            db.execute_sql('CREATE INDEX "shape_template_asset_id" ON "shape_template" ("asset_id")')

            for shape_id, asset_id, name in shape_template_data:
                db.execute_sql(
                    "INSERT INTO shape_template (owner_id, shape_id, asset_id, name) VALUES (?, ?, ?, ?)",
                    (entry_map[asset_id][2], shape_id, entry_map[asset_id][0], name),
                )

            # STEP 5: MIGRATE CHARACTERS

            character_data = db.execute_sql("SELECT id, asset_id FROM character").fetchall()
            for character_id, asset_id in character_data:
                db.execute_sql(
                    "UPDATE character SET asset_id = ? WHERE id = ?",
                    (entry_map[asset_id][0], character_id),
                )

            # STEP 6: MIGRATE ROOMS

            room_data = db.execute_sql("SELECT id, logo_id FROM room WHERE logo_id IS NOT NULL").fetchall()
            for room_id, logo_id in room_data:
                db.execute_sql(
                    "UPDATE room SET logo_id = ? WHERE id = ?",
                    (entry_map[logo_id][0], room_id),
                )

            # STEP 7: MIGRATE ASSET SHORTCUTS

            asset_shortcut_data = db.execute_sql("SELECT id, asset_id, player_room_id FROM asset_shortcut").fetchall()
            db.execute_sql("DROP TABLE asset_shortcut")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "asset_shortcut" ("id" INTEGER NOT NULL PRIMARY KEY, "entry_id" INTEGER NOT NULL, "player_room_id" INTEGER NOT NULL, FOREIGN KEY ("entry_id") REFERENCES "asset_entry" ("id") ON DELETE CASCADE, FOREIGN KEY ("player_room_id") REFERENCES "player_room" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "asset_shortcut_entry_id" ON "asset_shortcut" ("entry_id")')
            db.execute_sql('CREATE INDEX "asset_shortcut_player_room_id" ON "asset_shortcut" ("player_room_id")')

            for asset_shortcut_id, asset_id, player_room_id in asset_shortcut_data:
                db.execute_sql(
                    "INSERT INTO asset_shortcut (entry_id, player_room_id) VALUES (?, ?)",
                    (entry_map[asset_id][1], player_room_id),
                )
    else:
        raise UnknownVersionException(f"No upgrade code for save format {version} was found.")
    inc_save_version(db)
    db.foreign_keys = True


def upgrade_save(
    db: SqliteExtDatabase | None = None,
    *,
    is_import=False,
    loop: asyncio.AbstractEventLoop | None = None,
):
    if db is None:
        db = ACTIVE_DB
    try:
        save_version = get_save_version(db)
    except:
        if is_import:
            raise Exception("The import save database is not correctly formatted. Failed to import")
        else:
            logger.error("Database does not conform to expected format. Failed to start.")
            sys.exit(2)

    if save_version == SAVE_VERSION:
        return
    else:
        logger.warning(f"Save format {save_version} does not match the required version {SAVE_VERSION}!")
        logger.warning("Attempting upgrade")

    while save_version != SAVE_VERSION:
        if not is_import:
            backup_save(save_version)

        if is_import:
            logger.warning(f"Upgrading import save to {save_version + 1}")
        else:
            logger.warning(f"Starting upgrade to {save_version + 1}")
        try:
            upgrade(db, save_version, is_import, loop)
        except Exception as e:
            logger.exception(e)
            if is_import:
                logger.error("ERROR: Failed to upgrade import save")
            else:
                logger.error("ERROR: Could not start server")
                sys.exit(2)
        else:
            logger.warning(f"Upgrade to {save_version + 1} done.")
            save_version = get_save_version(db)
    logger.warning("Upgrade process completed successfully.")


def backup_save(version: int):
    save_backups = FILE_DIR / "save_backups"
    if not save_backups.is_dir():
        save_backups.mkdir()
    backup_path = save_backups.resolve() / f"{SAVE_PATH.name}.{version}"
    logger.warning(f"Backing up old save as {backup_path}")
    shutil.copyfile(SAVE_PATH, backup_path)


def migrate_assets_folder():
    for fl in ASSETS_DIR.iterdir():
        if fl.is_dir():
            continue
        first_level = fl.name[:2]
        second_level = fl.name[2:4]

        (ASSETS_DIR / first_level / second_level).mkdir(exist_ok=True, parents=True)
        shutil.copy(fl, ASSETS_DIR / first_level / second_level / fl.name)


def remove_old_assets():
    for fl in ASSETS_DIR.iterdir():
        if fl.is_dir():
            continue
        fl.unlink()


async def generate_thumbnails(data, loop):
    total_size = len(data)
    print()
    print(f"Generating thumbnails for {total_size} assets - This might take a while.")
    print("This process is ran in the background and will log a message when complete")
    print("Please don't stop the server while this is running.")
    print()

    def generate():
        for i, (asset_name, file_hash) in enumerate(data):
            generate_thumbnail_for_asset(file_hash)

            if i % 100 == 0:
                print(f"Generated {i} / {total_size} thumbnails")

    await loop.run_in_executor(None, generate)

    print()
    print("Thumbnail generation completed.")
    print()
