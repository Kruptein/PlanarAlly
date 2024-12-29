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
"""

SAVE_VERSION = 100

import asyncio
import json
import logging
import secrets
import shutil
import sys
from pathlib import Path
from typing import Optional
from uuid import uuid4

from playhouse.sqlite_ext import SqliteExtDatabase

from .thumbnail import generate_thumbnail_for_asset

from .config import SAVE_FILE
from .db.all import ALL_MODELS
from .db.db import db as ACTIVE_DB
from .db.models.constants import Constants
from .utils import (
    ASSETS_DIR,
    FILE_DIR,
    OldVersionException,
    UnknownVersionException,
    get_asset_hash_subpath,
)

logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)


def get_save_version(db: SqliteExtDatabase):
    return db.execute_sql("SELECT save_version FROM constants").fetchone()[0]


def inc_save_version(db: SqliteExtDatabase):
    db.execute_sql("UPDATE constants SET save_version = save_version + 1")


def create_new_db(db: SqliteExtDatabase, version: int):
    db.create_tables(ALL_MODELS)
    Constants.create(
        save_version=version,
        secret_token=secrets.token_bytes(32),
        api_token=secrets.token_hex(32),
    )


def check_existence() -> bool:
    if not SAVE_FILE.exists():
        logger.warning("Provided save file does not exist.  Creating a new one.")
        create_new_db(ACTIVE_DB, SAVE_VERSION)
        return True
    return False


def upgrade(
    db: SqliteExtDatabase,
    version: int,
    is_import: bool,
    loop: Optional[asyncio.AbstractEventLoop] = None,
):
    if version < 79:
        raise OldVersionException(
            f"Upgrade code for this version is >2 years old and is no longer in the active codebase to reduce clutter. You can still find this code on github, contact me for more info."
        )

    db.foreign_keys = False

    if version == 79:
        # Add UserOptions.show_token_directions
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN show_token_directions INTEGER DEFAULT 1"
            )
            db.execute_sql(
                "UPDATE user_options SET show_token_directions = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 80:
        # Add UserOptions.mouse_pan_mode
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN mouse_pan_mode INTEGER DEFAULT 3"
            )
            db.execute_sql(
                "UPDATE user_options SET mouse_pan_mode = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 81:
        # Double check UserOption modifications (lg related)
        with db.atomic():
            for option in [
                "render_all_floors",
                "use_tool_icons",
                "default_tracker_mode",
                "show_token_directions",
                "mouse_pan_mode",
            ]:
                try:
                    db.execute_sql(f"SELECT {option} FROM user_options")
                except:
                    logger.warning(f"PATCHING {option}")
                    default = 1
                    if option == "mouse_pan_mode":
                        default = 3
                    db.execute_sql(
                        f"ALTER TABLE user_options ADD COLUMN {option} INTEGER DEFAULT {default}"
                    )
                    db.execute_sql(
                        f"UPDATE user_options SET {option} = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
                    )
    elif version == 82:
        # Fix spawn-location issues
        with db.atomic():
            data = db.execute_sql(
                "SELECT lo.id, lo.spawn_locations, l.id FROM location_options lo INNER JOIN location l ON l.options_id = lo.id"
            )
            for lo_id, spawn_locations, l_id in data.fetchall():
                if spawn_locations is None or spawn_locations == "[]":
                    continue

                unpacked_spawn_locations = json.loads(spawn_locations)
                changed = False

                shape_data = db.execute_sql(
                    "SELECT s.uuid, s.type_, l.type_ FROM shape s INNER JOIN layer l ON s.layer_id = l.id INNER JOIN floor f ON f.id = l.floor_id WHERE f.location_id = ?",
                    (l_id,),
                )

                for shape_id, shape_type, layer_type in shape_data.fetchall():
                    if shape_type != "assetrect":
                        if shape_id in unpacked_spawn_locations:
                            # remove from spawn locations
                            unpacked_spawn_locations = [
                                sl for sl in unpacked_spawn_locations if sl != shape_id
                            ]
                            changed = True
                            continue
                    else:
                        shape_src_data = db.execute_sql(
                            "SELECT src FROM asset_rect WHERE shape_id=?",
                            (shape_id,),
                        ).fetchone()
                        if not shape_src_data:
                            continue
                        shape_src = shape_src_data[0]
                        if not shape_src.endswith("/static/img/spawn.png"):
                            if shape_id in unpacked_spawn_locations:
                                # remove from spawn locations
                                unpacked_spawn_locations = [
                                    sl
                                    for sl in unpacked_spawn_locations
                                    if sl != shape_id
                                ]
                                changed = True
                        elif (
                            layer_type != "dm"
                            and shape_id not in unpacked_spawn_locations
                        ):
                            # add to spawn locations
                            unpacked_spawn_locations.append(shape_id)
                            changed = True

                if changed:
                    db.execute_sql(
                        "UPDATE location_options SET spawn_locations=? WHERE id=?",
                        (json.dumps(unpacked_spawn_locations), lo_id),
                    )
    elif version == 83:
        # Add Initiative.is_active
        # Add UserOptions.initiative_open_on_activate
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE initiative ADD COLUMN is_active INTEGER DEFAULT 0 NOT NULL"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN initiative_open_on_activate INTEGER DEFAULT 1"
            )
            db.execute_sql(
                "UPDATE user_options SET initiative_open_on_activate = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 84:
        # Add LocationOptions.limit_movement_during_initiative
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN limit_movement_during_initiative INTEGER DEFAULT 0"
            )
            db.execute_sql(
                "UPDATE location_options SET limit_movement_during_initiative = NULL WHERE id NOT IN (SELECT default_options_id FROM room)"
            )
    elif version == 85:
        # Add Character things
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "character" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "owner_id" INTEGER NOT NULL, "asset_id" INTEGER NOT NULL, "campaign_id" INTEGER DEFAULT NULL, FOREIGN KEY ("owner_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE RESTRICT, FOREIGN KEY ("campaign_id") REFERENCES "room" ("id") ON DELETE SET NULL)'
            )
            db.execute_sql("CREATE TEMPORARY TABLE _shape_85 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, "is_invisible" INTEGER NOT NULL DEFAULT 0, "default_movement_access" INTEGER NOT NULL DEFAULT 0, "is_locked" INTEGER NOT NULL DEFAULT 0, "angle" REAL NOT NULL DEFAULT 0, "stroke_width" INTEGER NOT NULL DEFAULT 2, "asset_id" INTEGER DEFAULT NULL, "group_id" TEXT DEFAULT NULL, "annotation_visible" INTEGER NOT NULL DEFAULT 0, "ignore_zoom_size" INTEGER DEFAULT 0, "is_defeated" INTEGER NOT NULL DEFAULT 0, "is_door" INTEGER DEFAULT 0 NOT NULL, "is_teleport_zone" INTEGER DEFAULT 0 NOT NULL, "character_id" INTEGER DEFAULT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE SET NULL, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL);'
            )
            db.execute_sql(
                'INSERT INTO "shape" ("uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "is_token", "annotation", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "annotation_visible", "ignore_zoom_size", "is_defeated", "is_door", "is_teleport_zone") SELECT "uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "is_token", "annotation", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "annotation_visible", "ignore_zoom_size", "is_defeated", "is_door", "is_teleport_zone" FROM _shape_85'
            )
            db.execute_sql("DROP TABLE _shape_85")
    elif version == 86:
        # Add DataBlock
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "room_data_block" ("id" INTEGER NOT NULL PRIMARY KEY, "source" TEXT NOT NULL, "name" TEXT NOT NULL, "room_id" TEXT NOT NULL, "data" TEXT NOT NULL, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "room_data_block_keys" ON "room_data_block" ("source", "name", "room_id");'
            )
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape_data_block" ("id" INTEGER NOT NULL PRIMARY KEY, "source" TEXT NOT NULL, "name" TEXT NOT NULL, "shape_id" TEXT NOT NULL, "data" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "shape_data_block_keys" ON "shape_data_block" ("source", "name", "shape_id");'
            )
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "user_data_block" ("id" INTEGER NOT NULL PRIMARY KEY, "source" TEXT NOT NULL, "name" TEXT NOT NULL, "user_id" TEXT NOT NULL, "data" TEXT NOT NULL, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "user_data_block_keys" ON "user_data_block" ("source", "name", "user_id");'
            )
    elif version == 87:
        # Add AssetShare
        db.execute_sql(
            'CREATE TABLE IF NOT EXISTS "asset_share" ("id" INTEGER NOT NULL PRIMARY KEY, "asset_id" INT NOT NULL, "user_id" INT NOT NULL, "right" TEXT NOT NULL, "name" TEXT NOT NULL, "parent_id" INT NOT NULL, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("parent_id") REFERENCES "asset" ("id") ON DELETE CASCADE)'
        )
    elif version == 88:
        with db.atomic():
            # Add new Note fields
            db.execute_sql("CREATE TEMPORARY TABLE _note_88 AS SELECT * FROM note")
            db.execute_sql("DROP TABLE note")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note" ("uuid" TEXT NOT NULL PRIMARY KEY, "creator_id" INTEGER NOT NULL, "title" TEXT NOT NULL DEFAULT \'\', "text" TEXT NOT NULL DEFAULT \'\', "tags" TEXT DEFAULT NULL, "show_on_hover" INT DEFAULT 0 NOT NULL, "show_icon_on_shape" INT DEFAULT 0 NOT NULL, "room_id" INTEGER DEFAULT NULL, "location_iD" INTEGER DEFAULT NULL, FOREIGN KEY ("creator_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "note_room_id" ON "note" ("room_id")')
            db.execute_sql('CREATE INDEX "note_creator_id" ON "note" ("creator_id");')
            db.execute_sql(
                'INSERT INTO "note" ("uuid", "creator_id", "title", "text", "room_id") SELECT "uuid", "user_id", "title", "text", "room_id" FROM _note_88'
            )
            db.execute_sql("DROP TABLE _note_88")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note_access" ("id" INTEGER NOT NULL PRIMARY KEY, "note_id" TEXT NOT NULL, "user_id" INTEGER, can_edit INTEGER NOT NULL DEFAULT 0, can_view INTEGER NOT NULL DEFAULT 0, FOREIGN KEY ("note_id") REFERENCES "note" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX "note_access_note_id" ON "note_access" ("note_id")'
            )
            db.execute_sql(
                'CREATE INDEX "note_access_user_id" ON "note_access" ("user_id")'
            )
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "note_shape" ("id" INTEGER NOT NULL PRIMARY KEY, "note_id" TEXT NOT NULL, "shape_id" TEXT NOT NULL, FOREIGN KEY ("note_id") REFERENCES "note" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX "note_shape_note_id" ON "note_shape" ("note_id")'
            )
            db.execute_sql(
                'CREATE INDEX "note_shape_shape_id" ON "note_shape" ("shape_id")'
            )
            # Move all template annotations to notes
            data = db.execute_sql(
                "SELECT a.id, a.owner_id, a.name, a.options FROM asset a WHERE a.options != ''"
            )
            asset_id_to_note_id = {}
            for asset_id, asset_owner, asset_name, raw_options in data.fetchall():
                try:
                    asset_options = json.loads(raw_options)
                    templates = asset_options["templates"]
                except:
                    continue
                for template in templates.values():
                    if template.get("annotation", "") == "":
                        continue

                    note_id = str(uuid4())
                    asset_id_to_note_id[asset_id] = note_id
                    db.execute_sql(
                        'INSERT INTO "note" ("uuid", "creator_id", "title", "text", "room_id") VALUES (?, ?, ?, ?, ?)',
                        (
                            note_id,
                            asset_owner,
                            asset_name or "?",
                            template["annotation"],
                            None,
                        ),
                    )

                    del template["annotation"]

                    # Grant default view access if the annotation was public
                    if template.get("annotation_visible", False):
                        db.execute_sql(
                            'INSERT INTO "note_access" ("note_id", "can_edit", "can_view") VALUES (?, ?, ?)',
                            (note_id, 0, 1),
                        )

                    if "annotation_visible" in template:
                        del template["annotation_visible"]

                    options = json.loads(template.get("options", "[]"))
                    options.append(["templateNoteIds", [note_id]])
                    template["options"] = json.dumps(options)
                db.execute_sql(
                    "UPDATE asset SET options=? WHERE id=?",
                    (json.dumps(asset_options), asset_id),
                )

            # Move all annotation to notes
            data = db.execute_sql(
                "SELECT s.uuid, s.name, s.annotation, s.annotation_visible, s.asset_id, s.character_id, l2.id, r.id, u.id FROM shape s LEFT OUTER JOIN layer l ON s.layer_id = l.id LEFT OUTER JOIN floor f ON f.id = l.floor_id LEFT OUTER JOIN location l2 ON l2.id = f.location_id LEFT OUTER JOIN room r ON r.id = l2.room_id LEFT OUTER JOIN user u ON u.id = r.creator_id WHERE s.annotation != ''"
            )
            shape_to_note_ids = {}
            for (
                shape_uuid,
                name,
                annotation,
                annotation_visible,
                asset_id,
                character_id,
                location_id,
                room_id,
                creator_id,
            ) in data.fetchall():
                if asset_id is not None and asset_id in asset_id_to_note_id:
                    note_id = asset_id_to_note_id[asset_id]
                elif location_id is not None:
                    note_id = str(uuid4())
                    db.execute_sql(
                        'INSERT INTO "note" ("uuid", "creator_id", "title", "text", "room_id", "location_id") VALUES (?, ?, ?, ?, ?, ?)',
                        (
                            note_id,
                            creator_id,
                            name or "?",
                            annotation,
                            room_id,
                            location_id,
                        ),
                    )
                    # Grant default view access if the annotation was public
                    if annotation_visible:
                        db.execute_sql(
                            'INSERT INTO "note_access" ("note_id", "can_edit", "can_view") VALUES (?, ?, ?)',
                            (note_id, 0, 1),
                        )
                elif character_id is not None:
                    # The shape no longer has a layer associated, we do have a character to figure out who the owner is!
                    data = db.execute_sql(
                        "SELECT owner_id, asset_id FROM character WHERE id=?",
                        (character_id,),
                    )
                    results = data.fetchone()
                    if results is None:
                        continue

                    (owner_id, asset_id) = results
                    if asset_id is not None and asset_id in asset_id_to_note_id:
                        note_id = asset_id_to_note_id[asset_id]
                    else:
                        note_id = str(uuid4())

                    db.execute_sql(
                        'INSERT INTO "note" ("uuid", "creator_id", "title", "text") VALUES (?, ?, ?, ?)',
                        (
                            note_id,
                            owner_id,
                            name or "?",
                            annotation,
                        ),
                    )
                    # Grant default view access if the annotation was public
                    if annotation_visible:
                        db.execute_sql(
                            'INSERT INTO "note_access" ("note_id", "can_edit", "can_view") VALUES (?, ?, ?)',
                            (note_id, 0, 1),
                        )
                else:
                    # The shape has no layer info and is not a character, we have no clue on who the note belongs to
                    # These shapes are probably no longer valid anyway
                    # In theory shape.owners should have info, but in the cases checked, this was empty
                    continue
                shape_to_note_ids[shape_uuid] = note_id
                # Attach shape to note
                db.execute_sql(
                    'INSERT INTO "note_shape" ("note_id", "shape_id") VALUES (?, ?)',
                    (note_id, shape_uuid),
                )
            # Give every user with edit access to a shape access to the note
            data = db.execute_sql(
                "SELECT so.user_id, so.shape_id FROM shape_owner so INNER JOIN shape s ON s.uuid = so.shape_id WHERE s.annotation != '' AND so.edit_access = 1"
            )
            for user_id, shape_id in data.fetchall():
                try:
                    note_id = shape_to_note_ids[shape_id]
                except KeyError:
                    continue
                db.execute_sql(
                    'INSERT INTO "note_access" ("note_id", "user_id", "can_edit", "can_view") VALUES (?, ?, ?, ?)',
                    (note_id, user_id, 1, 1),
                )
            # Remove annotation columns
            db.execute_sql("CREATE TEMPORARY TABLE _shape_88 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, "is_invisible" INTEGER NOT NULL DEFAULT 0, "default_movement_access" INTEGER NOT NULL DEFAULT 0, "is_locked" INTEGER NOT NULL DEFAULT 0, "angle" REAL NOT NULL DEFAULT 0, "stroke_width" INTEGER NOT NULL DEFAULT 2, "asset_id" INTEGER DEFAULT NULL, "group_id" TEXT DEFAULT NULL, "ignore_zoom_size" INTEGER DEFAULT 0, "is_defeated" INTEGER NOT NULL DEFAULT 0, "is_door" INTEGER DEFAULT 0 NOT NULL, "is_teleport_zone" INTEGER DEFAULT 0 NOT NULL, "character_id" INTEGER DEFAULT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE SET NULL, FOREIGN KEY ("group_id") REFERENCES "group" ("uuid") ON DELETE SET NULL, FOREIGN KEY ("character_id") REFERENCES "character" ("id") ON DELETE SET NULL);'
            )
            db.execute_sql(
                'INSERT INTO "shape" ("uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "is_token", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_defeated", "is_door", "is_teleport_zone", "character_id") SELECT "uuid", "layer_id", "type_", "x", "y", "name", "name_visible", "fill_colour", "stroke_colour", "vision_obstruction", "movement_obstruction", "is_token", "draw_operator", "index", "options", "badge", "show_badge", "default_edit_access", "default_vision_access", "is_invisible", "default_movement_access", "is_locked", "angle", "stroke_width", "asset_id", "group_id", "ignore_zoom_size", "is_defeated", "is_door", "is_teleport_zone", "character_id" FROM _shape_88'
            )
            db.execute_sql("DROP TABLE _shape_88")
    elif version == 89:
        # Add LocationOptions.drop_ratio
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN drop_ratio REAL DEFAULT 1"
            )
            db.execute_sql(
                "UPDATE location_options SET drop_ratio = NULL WHERE id NOT IN (SELECT default_options_id FROM room)"
            )
    elif version == 90:
        # Add Shape.odd_hex_orientation
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN odd_hex_orientation INTEGER DEFAULT 0"
            )
    elif version == 91:
        # Add UserOptions.grid_mode_label_format
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN grid_mode_label_format INTEGER DEFAULT 0"
            )
            db.execute_sql(
                "UPDATE user_options SET grid_mode_label_format = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 92:
        # Add Shape.size
        with db.atomic():
            db.execute_sql("ALTER TABLE shape ADD COLUMN size INTEGER DEFAULT 0")
    elif version == 93:
        # Add Shape.show_cells, Shape.cell_fill_colour, Shape.cell_stroke_colour, Shape.cell_stroke_width
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN show_cells INTEGER NOT NULL DEFAULT 0"
            )
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN cell_fill_colour TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN cell_stroke_colour TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN cell_stroke_width INTEGER DEFAULT NULL"
            )
    elif version == 94:
        # Add Room.enable_chat Room.enable_dice
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE room ADD COLUMN enable_chat INTEGER NOT NULL DEFAULT 1"
            )
            db.execute_sql(
                "ALTER TABLE room ADD COLUMN enable_dice INTEGER NOT NULL DEFAULT 1"
            )
    elif version == 95:
        # Remove labels
        with db.atomic():
            db.execute_sql("DROP TABLE shape_label")
            db.execute_sql("DROP TABLE label_selection")
            db.execute_sql("DROP TABLE label")
    elif version == 96:
        # Add UserOptions.default_wall_colour, UserOptions.default_window_colour, UserOptions.default_closed_door_colour, UserOptions.default_open_door_colour
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN default_wall_colour TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN default_window_colour TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN default_closed_door_colour TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN default_open_door_colour TEXT DEFAULT NULL"
            )
    elif version == 97:
        # Add folder structure to the assets folder

        # 1 first copy the physical files to their new location
        if not is_import:
            migrate_assets_folder()

        # 2 update asset shapes in the DB
        with db.atomic():
            data = db.execute_sql("SELECT shape_id, src FROM asset_rect")
            for shape_id, src in data.fetchall():
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
            data = db.execute_sql(
                "SELECT name, file_hash FROM asset WHERE file_hash NOT NULL"
            ).fetchall()

            loop.create_task(generate_thumbnails(data, loop))
    elif version == 99:
        # Add AssetShortcut
        with db.atomic():
            db.execute_sql(
                "CREATE TABLE IF NOT EXISTS asset_shortcut (id INTEGER NOT NULL PRIMARY KEY, asset_id INTEGER NOT NULL, player_room_id INTEGER NOT NULL, FOREIGN KEY (asset_id) REFERENCES asset (id) ON DELETE CASCADE, FOREIGN KEY (player_room_id) REFERENCES player_room (id) ON DELETE CASCADE)"
            )
    else:
        raise UnknownVersionException(
            f"No upgrade code for save format {version} was found."
        )
    inc_save_version(db)
    db.foreign_keys = True


def upgrade_save(
    db: Optional[SqliteExtDatabase] = None,
    *,
    is_import=False,
    loop: Optional[asyncio.AbstractEventLoop] = None,
):
    if db is None:
        db = ACTIVE_DB
    try:
        save_version = get_save_version(db)
    except:
        if is_import:
            raise Exception(
                "The import save database is not correctly formatted. Failed to import"
            )
        else:
            logger.error(
                "Database does not conform to expected format. Failed to start."
            )
            sys.exit(2)

    if save_version == SAVE_VERSION:
        return
    else:
        logger.warning(
            f"Save format {save_version} does not match the required version {SAVE_VERSION}!"
        )
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
    backup_path = save_backups.resolve() / f"{Path(SAVE_FILE).name}.{version}"
    logger.warning(f"Backing up old save as {backup_path}")
    shutil.copyfile(SAVE_FILE, backup_path)


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
            generate_thumbnail_for_asset(asset_name, file_hash)

            if i % 100 == 0:
                print(f"Generated {i} / {total_size} thumbnails")

    await loop.run_in_executor(None, generate)

    print()
    print("Thumbnail generation completed.")
    print()
