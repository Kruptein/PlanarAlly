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

SAVE_VERSION = 70

import json
import logging
import secrets
import shutil
import sys
from pathlib import Path
from playhouse.sqlite_ext import SqliteExtDatabase

from config import SAVE_FILE
from models import ALL_MODELS, Constants
from models.db import db
from utils import OldVersionException, UnknownVersionException

logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)


def get_save_version():
    return db.execute_sql("SELECT save_version FROM constants").fetchone()[0]


def inc_save_version():
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
        create_new_db(db, SAVE_VERSION)
        return True
    return False


def upgrade(version):
    if version < 61:
        raise OldVersionException(
            f"Upgrade code for this version is >1 year old and is no longer in the active codebase to reduce clutter. You can still find this code on github, contact me for more info."
        )

    db.foreign_keys = False

    if version == 61:
        # Initiative changes
        # Add UserOptions initiative settings
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN initiative_camera_lock INTEGER DEFAULT 0"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN initiative_vision_lock INTEGER DEFAULT 0"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN initiative_effect_visibility TEXT DEFAULT 'active'"
            )
            data = db.execute_sql(
                "UPDATE user_options SET initiative_camera_lock = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
            data = db.execute_sql(
                "UPDATE user_options SET initiative_vision_lock = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
            data = db.execute_sql(
                "UPDATE user_options SET initiative_effect_visibility = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _initiative_61 AS SELECT * FROM initiative"
            )
            db.execute_sql("DROP TABLE initiative")
            db.execute_sql(
                'CREATE TABLE "initiative" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "round" INTEGER NOT NULL, "sort" INTEGER NOT NULL DEFAULT 0, "turn" INTEGER NOT NULL, "data" TEXT NOT NULL, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )

            location_data = db.execute_sql(
                "SELECT id, location_id, round, turn FROM initiative_location_data"
            )
            for raw_location in location_data.fetchall():
                initiative_data = db.execute_sql(
                    'SELECT uuid, initiative, visible, "group" FROM _initiative_61 as i WHERE i.location_data_id = ?',
                    (raw_location[0],),
                )
                turn = 0

                initiative_list = []
                for i, raw_initiative in enumerate(initiative_data.fetchall()):
                    if raw_initiative[0] == raw_location[3]:
                        turn = i

                    initiative = {
                        "shape": raw_initiative[0],
                        "initiative": raw_initiative[1],
                        "isVisible": raw_initiative[2],
                        "isGroup": raw_initiative[3],
                        "effects": [],
                    }
                    effect_data = db.execute_sql(
                        "SELECT name, turns FROM initiative_effect WHERE initiative_id = ?",
                        (raw_initiative[0],),
                    )
                    for raw_effect in effect_data.fetchall():
                        effect = {
                            "name": raw_effect[0],
                            "turns": raw_effect[1],
                            "highlightsActor": False,
                        }
                        initiative["effects"].append(effect)
                    initiative_list.append(initiative)
                db.execute_sql(
                    "INSERT INTO initiative (location_id, round, turn, data) VALUES (?, ?, ?, ?)",
                    (
                        raw_location[1],
                        raw_location[2],
                        turn,
                        json.dumps(initiative_list),
                    ),
                )
            db.execute_sql("DROP TABLE initiative_effect")
            db.execute_sql("DROP TABLE _initiative_61")
            db.execute_sql("DROP TABLE initiative_location_data")
    elif version == 62:
        # Add UserOptions.use_as_physical_board .ppi and .mini_size
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN use_as_physical_board INTEGER DEFAULT 0"
            )
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN mini_size REAL DEFAULT 1"
            )
            db.execute_sql("ALTER TABLE user_options ADD COLUMN ppi INTEGER DEFAULT 96")
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN use_high_dpi INTEGER DEFAULT 0"
            )
            data = db.execute_sql(
                "UPDATE user_options SET use_as_physical_board = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
            data = db.execute_sql(
                "UPDATE user_options SET mini_size = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
            data = db.execute_sql(
                "UPDATE user_options SET ppi = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
            data = db.execute_sql(
                "UPDATE user_options SET use_high_dpi = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 63:
        # Rename LocationUserOption.zoom_factor to zoom_display
        with db.atomic():
            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_user_option_27 AS SELECT * FROM location_user_option"
            )
            db.execute_sql("DROP TABLE location_user_option")
            db.execute_sql(
                'CREATE TABLE "location_user_option" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "user_id" INTEGER NOT NULL, "pan_x" INTEGER NOT NULL, "pan_y" INTEGER NOT NULL, "zoom_display" REAL NOT NULL, "active_layer_id" INTEGER, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("active_layer_id") REFERENCES "layer" ("id"))'
            )
            db.execute_sql(
                'INSERT INTO "location_user_option" (id, location_id, user_id, pan_x, pan_y, zoom_display, active_layer_id) SELECT id, location_id, user_id, pan_x, pan_y, zoom_factor, active_layer_id FROM _location_user_option_27 '
            )
    elif version == 64:
        # Add LocationOptions.map_background_{air/ground/underground}
        # Add Floor.type_ and Floor.background_color
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN air_map_background TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN ground_map_background TEXT DEFAULT NULL"
            )
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN underground_map_background TEXT DEFAULT NULL"
            )
            data = db.execute_sql("SELECT default_options_id FROM room")

            db.execute_sql(
                "ALTER TABLE floor ADD COLUMN type_ INTEGER NOT NULL DEFAULT 1"
            )
            db.execute_sql(
                "ALTER TABLE floor ADD COLUMN background_color TEXT DEFAULT NULL"
            )
    elif version == 65:
        # Migrate new saves to allow NULL for map backgrounds
        with db.atomic():
            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_options_65 AS SELECT * FROM location_options"
            )
            db.execute_sql("DROP TABLE location_options")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "location_options" ("id" INTEGER NOT NULL PRIMARY KEY, "unit_size" REAL, "unit_size_unit" TEXT, "use_grid" INTEGER, "full_fow" INTEGER, "fow_opacity" REAL, "fow_los" INTEGER, "vision_mode" TEXT, "vision_min_range" REAL, "vision_max_range" REAL, "spawn_locations" TEXT NOT NULL, "move_player_on_token_change" INTEGER, "grid_type" TEXT, "air_map_background" TEXT, "ground_map_background" TEXT, "underground_map_background" TEXT);'
            )
            db.execute_sql(
                'INSERT INTO "location_options" (id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, spawn_locations, move_player_on_token_change, grid_type, air_map_background, ground_map_background, underground_map_background) SELECT id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, spawn_locations, move_player_on_token_change, grid_type, air_map_background, ground_map_background, underground_map_background FROM _location_options_65 '
            )
    elif version == 66:
        # Add Shape.IsDoor
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_door INTEGER DEFAULT 0 NOT NULL"
            )
    elif version == 67:
        # Add Shape.IsTeleportZone
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_teleport_zone INTEGER DEFAULT 0 NOT NULL"
            )
    elif version == 68:
        # Model change in logic options (doorConditions -> door, conditions -> permissions)
        with db.atomic():
            data = db.execute_sql("SELECT uuid, options FROM shape")
            for row in data.fetchall():
                uuid, options = row
                if options is None:
                    continue

                unpacked_options = json.loads(options)
                changed = False

                for option in unpacked_options:
                    if option[0] == "doorConditions":
                        option[0] = "door"
                        changed = True
                    elif option[0] == "teleport":
                        option[1]["permissions"] = option[1]["conditions"]
                        del option[1]["conditions"]
                        changed = True

                if changed:
                    db.execute_sql(
                        "UPDATE shape SET options=? WHERE uuid=?",
                        (json.dumps(unpacked_options), uuid),
                    )
    elif version == 69:
        # Change Room.logo on_delete logic from cascade to set null
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _room_69 AS SELECT * FROM room")
            db.execute_sql("DROP TABLE room")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "room" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "creator_id" INTEGER NOT NULL, "invitation_code" TEXT NOT NULL, "is_locked" INTEGER NOT NULL, "default_options_id" INTEGER NOT NULL, "logo_id" INTEGER, FOREIGN KEY ("creator_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("default_options_id") REFERENCES "location_options" ("id") ON DELETE CASCADE, FOREIGN KEY ("logo_id") REFERENCES "asset" ("id") ON DELETE SET NULL);'
            )
            db.execute_sql(
                'INSERT INTO "room" (id, name, creator_id, invitation_code, is_locked, default_options_id, logo_id) SELECT id, name, creator_id, invitation_code, is_locked, default_options_id, logo_id FROM _room_69'
            )
    else:
        raise UnknownVersionException(
            f"No upgrade code for save format {version} was found."
        )
    inc_save_version()
    db.foreign_keys = True


def check_outdated():
    try:
        save_version = get_save_version()
    except:
        logger.error("Database does not conform to expected format. Failed to start.")
        sys.exit(2)
    if save_version != SAVE_VERSION:
        logger.warning(
            f"Save format {save_version} does not match the required version {SAVE_VERSION}!"
        )
        logger.warning("Attempting upgrade")

    updated = False
    while save_version != SAVE_VERSION:
        updated = True
        save_backups = Path("save_backups")
        if not save_backups.is_dir():
            save_backups.mkdir()
        backup_path = save_backups.resolve() / f"{Path(SAVE_FILE).name}.{save_version}"
        logger.warning(f"Backing up old save as {backup_path}")
        shutil.copyfile(SAVE_FILE, backup_path)
        logger.warning(f"Starting upgrade to {save_version + 1}")
        try:
            upgrade(save_version)
        except Exception as e:
            logger.exception(e)
            logger.error("ERROR: Could not start server")
            sys.exit(2)
        else:
            logger.warning(f"Upgrade to {save_version + 1} done.")
            save_version = get_save_version()
    else:
        if updated:
            logger.warning("Upgrade process completed successfully.")
