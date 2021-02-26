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

SAVE_VERSION = 58

import datetime
import json
import logging
import os
import secrets
import shutil
import sys
from pathlib import Path
from uuid import uuid4

from peewee import (
    BooleanField,
    ForeignKeyField,
    IntegerField,
)
from playhouse.migrate import SqliteMigrator, migrate

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


def upgrade(version):
    if version < 20:
        raise OldVersionException(
            f"Upgrade code for this version is >1 year old and is no longer in the active codebase to reduce clutter. You can still find this code on github, contact me for more info."
        )

    db.foreign_keys = False

    if version == 20:
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(
                migrator.add_column("shape", "badge", IntegerField(default=1)),
                migrator.add_column("shape", "show_badge", BooleanField(default=False)),
            )
    elif version == 21:
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(
                migrator.add_column("user", "invert_alt", BooleanField(default=False))
            )
    elif version == 22:
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "marker" ("id" INTEGER NOT NULL PRIMARY KEY, "shape_id" TEXT NOT NULL, "user_id" INTEGER NOT NULL, "location_id" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape"("uuid") ON DELETE CASCADE, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE)'
            )
    elif version == 23:
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(
                migrator.add_column(
                    "shape_owner", "edit_access", BooleanField(default=True)
                ),
                migrator.add_column(
                    "shape_owner", "vision_access", BooleanField(default=True)
                ),
                migrator.add_column(
                    "shape", "default_edit_access", BooleanField(default=False)
                ),
                migrator.add_column(
                    "shape", "default_vision_access", BooleanField(default=False)
                ),
            )
    elif version == 24:
        with db.atomic():
            db.execute_sql(
                'DELETE FROM "player_room" WHERE id IN (SELECT pr.id FROM "player_room" pr INNER JOIN "room" r ON r.id = pr.room_id WHERE r.creator_id = pr.player_id )'
            )
    elif version == 25:
        # Move Room.dm_location and Room.player_location to PlayerRoom.active_location
        # Add PlayerRoom.role
        # Add order index on location
        from models import Location

        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(
                migrator.add_column(
                    "player_room",
                    "active_location_id",
                    ForeignKeyField(
                        Location,
                        Location.id,
                        backref="players",
                        on_delete="CASCADE",
                        null=True,
                    ),
                ),
                migrator.add_column("player_room", "role", IntegerField(default=0)),
                migrator.add_column("location", "index", IntegerField(default=0)),
            )
            db.execute_sql(
                "UPDATE player_room SET active_location_id = (SELECT location.id FROM room INNER JOIN location ON room.id = location.room_id WHERE location.name = room.player_location AND room.id = player_room.room_id)"
            )
            db.execute_sql(
                "INSERT INTO player_room (role, player_id, room_id, active_location_id) SELECT 1, u.id, r.id, l.id FROM room r INNER JOIN user u ON u.id = r.creator_id INNER JOIN location l ON l.name = r.dm_location AND l.room_id = r.id"
            )
            db.execute_sql(
                "UPDATE location SET 'index' = (SELECT COUNT(*) + 1 FROM location l INNER JOIN room r WHERE location.room_id = r.id AND l.room_id = r.id AND l.'index' != 0) "
            )
            migrate(
                migrator.drop_column("room", "player_location"),
                migrator.drop_column("room", "dm_location"),
                migrator.add_not_null("player_room", "active_location_id"),
            )

    elif version == 26:
        # Move Location settings to a separate LocationSettings table
        # Add a default_settings field to Room that refers to such a LocationSettings row
        from models import LocationOptions

        migrator = SqliteMigrator(db)

        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "location_options" ("id" INTEGER NOT NULL PRIMARY KEY, "unit_size" REAL DEFAULT 5, "unit_size_unit" TEXT DEFAULT "ft", "use_grid" INTEGER DEFAULT 1, "full_fow" INTEGER DEFAULT 0, "fow_opacity" REAL DEFAULT 0.3, "fow_los" INTEGER DEFAULT 0, "vision_mode" TEXT DEFAULT "triangle", "vision_min_range" REAL DEFAULT 1640, "vision_max_range" REAL DEFAULT 3281, "grid_size" INTEGER DEFAULT 50)'
            )
            migrate(
                migrator.add_column(
                    "location",
                    "options_id",
                    ForeignKeyField(
                        LocationOptions,
                        LocationOptions.id,
                        on_delete="CASCADE",
                        null=True,
                    ),
                ),
                migrator.add_column(
                    "room",
                    "default_options_id",
                    ForeignKeyField(
                        LocationOptions,
                        LocationOptions.id,
                        on_delete="CASCADE",
                        null=True,
                    ),
                ),
            )
            data = db.execute_sql(
                """SELECT l.id, r.id, l.unit_size, l.unit_size_unit, l.use_grid, l.full_fow, l.fow_opacity, l.fow_los, l.vision_mode, l.vision_min_range, l.vision_max_range, g.size AS grid_size
                FROM location l
                INNER JOIN room r
                INNER JOIN floor f ON f.id = (SELECT id FROM floor f2 WHERE f2.location_id = l.id LIMIT 1)
                INNER JOIN layer la
                INNER JOIN grid_layer g
                WHERE r.id = l.room_id AND la.floor_id = f.id AND la.name = 'grid' AND g.layer_id = la.id"""
            )
            room_options = {}
            descr = data.description
            mapping = {
                "unit_size": 0,
                "unit_size_unit": 1,
                "use_grid": 2,
                "full_fow": 3,
                "fow_opacity": 4,
                "fow_los": 5,
                "vision_mode": 6,
                "vision_min_range": 7,
                "vision_max_range": 8,
                "grid_size": 9,
            }
            default_row = [5, "ft", True, False, 0.3, False, "triangle", 1640, 3281, 50]
            for row in data.fetchall():
                new_row = [None, None, None, None, None, None, None, None, None, None]

                if row[1] not in room_options:
                    room_options[row[1]] = db.execute_sql(
                        "INSERT INTO location_options (unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, grid_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        default_row,
                    ).lastrowid
                    db.execute_sql(
                        f"UPDATE room SET default_options_id = {room_options[row[1]]} WHERE id = {row[1]}"
                    )
                for col, val in zip(descr, row):
                    if col[0] in ["id", "room_id"]:
                        continue
                    idx = mapping[col[0]]
                    if val != default_row[idx]:
                        new_row[idx] = val

                loc_id = db.execute_sql(
                    "INSERT INTO location_options (unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, grid_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    new_row,
                ).lastrowid
                db.execute_sql(
                    f"UPDATE location SET options_id = {loc_id} WHERE id = {row[0]}"
                )

            migrate(
                migrator.add_not_null("room", "default_options_id"),
                migrator.drop_column("location", "unit_size"),
                migrator.drop_column("location", "unit_size_unit"),
                migrator.drop_column("location", "use_grid"),
                migrator.drop_column("location", "full_fow"),
                migrator.drop_column("location", "fow_opacity"),
                migrator.drop_column("location", "fow_los"),
                migrator.drop_column("location", "vision_mode"),
                migrator.drop_column("location", "vision_min_range"),
                migrator.drop_column("location", "vision_max_range"),
                migrator.drop_index("location", "location_room_id_name"),
            )
            db.execute_sql("DROP TABLE 'grid_layer'")

    elif version == 27:
        # Fix broken schemas from older save upgrades
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _floor_27 AS SELECT * FROM floor")
            db.execute_sql("DROP TABLE floor")
            db.execute_sql(
                'CREATE TABLE "floor" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "index" INTEGER NOT NULL, "name" TEXT NOT NULL, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "floor_location_id" ON "floor" ("location_id")'
            )
            db.execute_sql(
                'INSERT INTO floor (id, location_id, "index", name) SELECT id, location_id, "index", name FROM _floor_27'
            )

            db.execute_sql("CREATE TEMPORARY TABLE _label_27 AS SELECT * FROM label")
            db.execute_sql("DROP TABLE label")
            db.execute_sql(
                'CREATE TABLE "label" ("uuid" TEXT NOT NULL PRIMARY KEY, "user_id" INTEGER NOT NULL, "category" TEXT, "name" TEXT NOT NULL, "visible" INTEGER NOT NULL, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "label_user_id" ON "label" ("user_id")'
            )
            db.execute_sql(
                "INSERT INTO label (uuid, user_id, category, name, visible) SELECT uuid, user_id, category, name, visible FROM _label_27"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _layer_27 AS SELECT * FROM layer")
            db.execute_sql("DROP TABLE layer")
            db.execute_sql(
                'CREATE TABLE "layer" ("id" INTEGER NOT NULL PRIMARY KEY, "floor_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "type_" TEXT NOT NULL, "player_visible" INTEGER NOT NULL, "player_editable" INTEGER NOT NULL, "selectable" INTEGER NOT NULL, "index" INTEGER NOT NULL, FOREIGN KEY ("floor_id") REFERENCES "floor" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "layer_floor_id" ON "layer" ("floor_id")'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "layer_floor_id_index" ON "layer" ("floor_id", "index")'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "layer_floor_id_name" ON "layer" ("floor_id", "name")'
            )
            db.execute_sql(
                'INSERT INTO layer (id, floor_id, name, type_, player_visible, player_editable, selectable, "index") SELECT id, floor_id, name, type_, player_visible, player_editable, selectable, "index" FROM _layer_27'
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_27 AS SELECT * FROM location"
            )
            db.execute_sql("DROP TABLE location")
            db.execute_sql(
                'CREATE TABLE "location" ("id" INTEGER NOT NULL PRIMARY KEY, "room_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "options_id" INTEGER, "index" INTEGER NOT NULL, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("options_id") REFERENCES "location_options" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_room_id" ON "location" ("room_id")'
            )
            db.execute_sql(
                'INSERT INTO location (id, room_id, name, options_id, "index") SELECT id, room_id, name, options_id, "index" FROM _location_27'
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_options_27 AS SELECT * FROM location_options"
            )
            db.execute_sql("DROP TABLE location_options")
            db.execute_sql(
                'CREATE TABLE "location_options" ("id" INTEGER NOT NULL PRIMARY KEY, "unit_size" REAL, "unit_size_unit" TEXT, "use_grid" INTEGER, "full_fow" INTEGER, "fow_opacity" REAL, "fow_los" INTEGER, "vision_mode" TEXT, "grid_size" INTEGER, "vision_min_range" REAL, "vision_max_range" REAL)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_options_id" ON "location" ("options_id")'
            )
            db.execute_sql(
                "INSERT INTO location_options (id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, grid_size, vision_min_range, vision_max_range) SELECT id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, grid_size, vision_min_range, vision_max_range FROM _location_options_27"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_user_option_27 AS SELECT * FROM location_user_option"
            )
            db.execute_sql("DROP TABLE location_user_option")
            db.execute_sql(
                'CREATE TABLE "location_user_option" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "user_id" INTEGER NOT NULL, "pan_x" INTEGER NOT NULL, "pan_y" INTEGER NOT NULL, "zoom_factor" REAL NOT NULL, "active_layer_id" INTEGER, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("active_layer_id") REFERENCES "layer" ("id"))'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_user_option_location_id" ON "location_user_option" ("location_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_user_option_active_layer_id" ON "location_user_option" ("active_layer_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_user_option_user_id" ON "location_user_option" ("user_id")'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "location_user_option_location_id_user_id" ON "location_user_option" ("location_id", "user_id")'
            )
            db.execute_sql(
                "INSERT INTO location_user_option (id, location_id, user_id, pan_x, pan_y, zoom_factor, active_layer_id) SELECT id, location_id, user_id, pan_x, pan_y, zoom_factor, active_layer_id FROM _location_user_option_27"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _marker_27 AS SELECT * FROM marker")
            db.execute_sql("DROP TABLE marker")
            db.execute_sql(
                'CREATE TABLE "marker" ("id" INTEGER NOT NULL PRIMARY KEY, "shape_id" TEXT NOT NULL, "user_id" INTEGER NOT NULL, "location_id" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "marker_location_id" ON "marker" ("location_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "marker_shape_id" ON "marker" ("shape_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "marker_user_id" ON "marker" ("user_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "marker_location_id" ON "marker" ("location_id")'
            )
            db.execute_sql(
                "INSERT INTO marker (id, shape_id, user_id, location_id) SELECT id, shape_id, user_id, location_id FROM _marker_27"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _player_room_27 AS SELECT * FROM player_room"
            )
            db.execute_sql("DROP TABLE player_room")
            db.execute_sql(
                'CREATE TABLE "player_room" ("id" INTEGER NOT NULL PRIMARY KEY, "role" INTEGER NOT NULL, "player_id" INTEGER NOT NULL, "room_id" INTEGER NOT NULL, "active_location_id" INTEGER NOT NULL, FOREIGN KEY ("player_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("active_location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "player_room_active_location_id" ON "player_room" ("active_location_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "player_room_player_id" ON "player_room" ("player_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "player_room_room_id" ON "player_room" ("room_id")'
            )
            db.execute_sql(
                "INSERT INTO player_room (id, role, player_id, room_id, active_location_id) SELECT id, role, player_id, room_id, active_location_id FROM _player_room_27"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _polygon_27 AS SELECT * FROM polygon"
            )
            db.execute_sql("DROP TABLE polygon")
            db.execute_sql(
                'CREATE TABLE "polygon" ("shape_id" TEXT NOT NULL PRIMARY KEY, "vertices" TEXT NOT NULL, "line_width" INTEGER NOT NULL, "open_polygon" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                "INSERT INTO polygon (shape_id,vertices, line_width, open_polygon) SELECT shape_id,vertices, line_width, open_polygon FROM _polygon_27"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _room_27 AS SELECT * FROM room")
            db.execute_sql("DROP TABLE room")
            db.execute_sql(
                'CREATE TABLE "room" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "creator_id" INTEGER NOT NULL, "invitation_code" TEXT NOT NULL, "is_locked" INTEGER NOT NULL, "default_options_id" INTEGER NOT NULL, FOREIGN KEY ("creator_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("default_options_id") REFERENCES "location_options" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "room_creator_id" ON "room" ("creator_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "room_default_options_id" ON "room" ("default_options_id")'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "room_invitation_code" ON "room" ("invitation_code")'
            )
            db.execute_sql(
                'CREATE UNIQUE INDEX "room_name_creator_id" ON "room" ("name", "creator_id")'
            )
            db.execute_sql(
                "INSERT INTO room (id, name, creator_id, invitation_code, is_locked, default_options_id) SELECT id, name, creator_id, invitation_code, is_locked, default_options_id FROM _room_27"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _shape_27 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER NOT NULL, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "shape_layer_id" ON "shape" ("layer_id")'
            )
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access FROM _shape_27'
            )

            db.execute_sql("CREATE TEMPORARY TABLE _user_27 AS SELECT * FROM user")
            db.execute_sql("DROP TABLE user")
            db.execute_sql(
                'CREATE TABLE "user" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT, "password_hash" TEXT NOT NULL, "fow_colour" TEXT NOT NULL, "grid_colour" TEXT NOT NULL, "ruler_colour" TEXT NOT NULL, "invert_alt" INTEGER NOT NULL)'
            )
            db.execute_sql(
                "INSERT INTO user (id, name, email, password_hash, fow_colour, grid_colour, ruler_colour, invert_alt) SELECT id, name, email, password_hash, fow_colour, grid_colour, ruler_colour, invert_alt FROM _user_27"
            )

    elif version == 28:
        # Add invisibility toggle to shapes
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_invisible INTEGER NOT NULL DEFAULT 0"
            )

    elif version == 29:
        # Add movement access permission
        migrator = SqliteMigrator(db)

        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN default_movement_access INTEGER NOT NULL DEFAULT 0"
            )
            db.execute_sql("ALTER TABLE shape_owner ADD COLUMN movement_access INTEGER")
            db.execute_sql(
                "UPDATE shape_owner SET movement_access = CASE WHEN edit_access = 0 THEN 0 ELSE 1 END"
            )

            migrate(
                migrator.add_not_null("shape_owner", "movement_access"),
            )

    elif version == 30:
        # Add spawn locations
        with db.atomic():
            db.execute_sql(
                'ALTER TABLE location_options ADD COLUMN spawn_locations TEXT NOT NULL DEFAULT "[]"'
            )

    elif version == 31:
        # Add shape movement lock
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0"
            )

    elif version == 32:
        # Add Shape.angle and Shape.stroke_width
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN angle INTEGER NOT NULL DEFAULT 0"
            )
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN stroke_width INTEGER NOT NULL DEFAULT 2"
            )

    elif version == 33:
        # Add Floor.player_visible
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE floor ADD COLUMN player_visible INTEGER NOT NULL DEFAULT 1"
            )

    elif version == 34:
        # Fix Floor.index
        with db.atomic():
            data = db.execute_sql("SELECT id FROM location")
            for location_id in data.fetchall():
                db.execute_sql(
                    f"UPDATE floor SET 'index' = (SELECT COUNT(*)-1 FROM floor f WHERE f.location_id = {location_id[0]} AND f.id <= floor.id ) WHERE location_id = {location_id[0]}"
                )

    elif version == 35:
        # Move grid size to client options
        with db.atomic():
            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_options_35 AS SELECT * FROM location_options"
            )
            db.execute_sql("DROP TABLE location_options")
            db.execute_sql(
                'CREATE TABLE "location_options" ("id" INTEGER NOT NULL PRIMARY KEY, "unit_size" REAL, "unit_size_unit" TEXT, "use_grid" INTEGER, "full_fow" INTEGER, "fow_opacity" REAL, "fow_los" INTEGER, "vision_mode" TEXT, "vision_min_range" REAL, "vision_max_range" REAL, "spawn_locations" TEXT NOT NULL DEFAULT "[]")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_options_id" ON "location" ("options_id")'
            )
            db.execute_sql(
                "INSERT INTO location_options (id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, spawn_locations) SELECT id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, vision_min_range, vision_max_range, spawn_locations FROM _location_options_35"
            )
            db.execute_sql(
                "ALTER TABLE user ADD COLUMN grid_size INTEGER NOT NULL DEFAULT 50"
            )

    elif version == 36:
        # Change polygon vertices format from { x: number, y: number } to number[]
        with db.atomic():
            data = db.execute_sql("SELECT shape_id, vertices FROM polygon")
            for row in data.fetchall():
                try:
                    vertices = json.loads(row[1])
                    if len(vertices) == 0 or isinstance(vertices[0], list):
                        continue
                    vertices = json.dumps([[v["x"], v["y"]] for v in vertices])
                    db.execute_sql(
                        f"UPDATE 'polygon' SET 'vertices' = '{vertices}' WHERE 'shape_id' = '{row[0]}'"
                    )
                except json.decoder.JSONDecodeError:
                    print(f"Failed to update polygon vertices! {row}")

    elif version == 37:
        # Change shape.angle from integer field to float field
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _shape_37 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER NOT NULL, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, is_invisible INTEGER NOT NULL DEFAULT 0, default_movement_access INTEGER NOT NULL DEFAULT 0, is_locked INTEGER NOT NULL DEFAULT 0, angle REAL NOT NULL DEFAULT 0, stroke_width INTEGER NOT NULL DEFAULT 2, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql('CREATE INDEX "shape_layer_id" ON "shape" ("layer_id")')
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width FROM _shape_37'
            )
            db.execute_sql("CREATE TEMPORARY TABLE _text_37 AS SELECT * FROM text")
            db.execute_sql("DROP TABLE text")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "text" ("shape_id" TEXT NOT NULL PRIMARY KEY, "text" TEXT NOT NULL, "font" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE);'
            )
            db.execute_sql(
                "INSERT INTO text (shape_id, text, font) SELECT shape_id, text, font FROM _text_37"
            )

    elif version == 38:
        # Change polygon vertices format from { x: number, y: number } to number[]
        with db.atomic():
            data = db.execute_sql("SELECT shape_id, vertices FROM polygon")
            for row in data.fetchall():
                try:
                    vertices = json.loads(row[1])
                    if len(vertices) == 0 or isinstance(vertices[0], list):
                        continue
                    vertices = json.dumps([[v["x"], v["y"]] for v in vertices])
                    db.execute_sql(
                        f"UPDATE polygon SET vertices = '{vertices}' WHERE shape_id = '{row[0]}'"
                    )
                except json.decoder.JSONDecodeError:
                    print(f"Failed to update polygon vertices! {row}")

    elif version == 39:
        # Fix Shape.index being set to 'index'
        from models import Layer

        with db.atomic():
            data = db.execute_sql("SELECT id FROM layer")
            for row in data.fetchall():
                shape_query = db.execute_sql(
                    f"SELECT uuid FROM shape WHERE layer_id = '{row[0]}'"
                )
                for i, shape_row in enumerate(shape_query.fetchall()):
                    db.execute_sql(
                        f"UPDATE shape SET 'index' = {i} WHERE uuid = '{shape_row[0]}'"
                    )

    elif version == 40:
        # Add move_player_on_token_change to location_options
        with db.atomic():
            try:
                db.execute_sql(
                    "ALTER TABLE location_options ADD COLUMN move_player_on_token_change INTEGER DEFAULT 1"
                )
            except Exception as e:
                if e.args[0] == "duplicate column name: move_player_on_token_change":
                    # This addresses a save increase in a hotfix branch and a dev branch with the same version
                    upgrade(39)
                    return
                else:
                    raise e

    elif version == 41:
        # Add Asset.options and Shape.asset
        with db.atomic():
            db.execute_sql("ALTER TABLE asset ADD COLUMN options TEXT")

            db.execute_sql("CREATE TEMPORARY TABLE _shape_41 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER NOT NULL, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, is_invisible INTEGER NOT NULL DEFAULT 0, default_movement_access INTEGER NOT NULL DEFAULT 0, is_locked INTEGER NOT NULL DEFAULT 0, angle REAL NOT NULL DEFAULT 0, stroke_width INTEGER NOT NULL DEFAULT 2, asset_id INTEGER, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id"))'
            )
            db.execute_sql('CREATE INDEX "shape_layer_id" ON "shape" ("layer_id")')
            db.execute_sql('CREATE INDEX "shape_asset_id" ON "shape" ("asset_id")')
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width FROM _shape_41'
            )

    elif version == 42:
        # Add Notification and Constants.api_token
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "notification" ("uuid" TEXT NOT NULL PRIMARY KEY, "message" TEXT NOT NULL)'
            )
            db.execute_sql(
                "CREATE TEMPORARY TABLE _constants_42 AS SELECT * FROM constants"
            )
            db.execute_sql("DROP TABLE constants")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "constants" ("id" INTEGER NOT NULL PRIMARY KEY, "save_version" INTEGER NOT NULL, "secret_token" BLOB NOT NULL, "api_token" BLOB NOT NULL)'
            )
            api_token = secrets.token_hex(32)
            db.execute_sql(
                f"INSERT INTO constants (id, save_version, secret_token, api_token) SELECT id, save_version, secret_token, '{api_token}' FROM _constants_42"
            )
    elif version == 43:
        # Add grid_type
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE location_options ADD COLUMN grid_type TEXT DEFAULT NULL"
            )
            data = db.execute_sql("SELECT default_options_id FROM room")
            for row in data.fetchall():
                db.execute_sql(
                    f"UPDATE location_options SET 'grid_type' = 'SQUARE' WHERE id = '{row[0]}'"
                )
    elif version == 44:
        # Change initiative effect turns to textfield
        with db.atomic():
            db.execute_sql(
                "CREATE TEMPORARY TABLE _initiative_effect_44 AS SELECT * FROM initiative_effect"
            )
            db.execute_sql("DROP TABLE initiative_effect")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "initiative_effect" ("uuid" TEXT NOT NULL PRIMARY KEY, "initiative_id" TEXT NOT NULL, "name" TEXT NOT NULL, "turns" TEXT NOT NULL, FOREIGN KEY ("initiative_id") REFERENCES "initiative" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                "INSERT INTO initiative_effect (uuid, initiative_id, name, turns) SELECT uuid, initiative_id, name, turns FROM _initiative_effect_44"
            )
    elif version == 45:
        # Promote group to a dedicated DB structure AND fix 'index' values in Shape.index
        with db.atomic():
            db.execute_sql('UPDATE shape set "index" = 0 WHERE "index" = ?', ("index",))
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "group" ("uuid" TEXT NOT NULL PRIMARY KEY, "character_set" TEXT NOT NULL, "creation_order" TEXT DEFAULT "incrementing")'
            )
            db.execute_sql("CREATE TEMPORARY TABLE _shape_45 AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER NOT NULL, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, is_invisible INTEGER NOT NULL DEFAULT 0, default_movement_access INTEGER NOT NULL DEFAULT 0, is_locked INTEGER NOT NULL DEFAULT 0, angle REAL NOT NULL DEFAULT 0, stroke_width INTEGER NOT NULL DEFAULT 2, asset_id INTEGER, group_id TEXT, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE, FOREIGN KEY ("asset_id") REFERENCES "asset" ("id"), FOREIGN KEY ("group_id") REFERENCES "group" ("uuid"))'
            )
            db.execute_sql('CREATE INDEX "shape_layer_id" ON "shape" ("layer_id")')
            db.execute_sql('CREATE INDEX "shape_asset_id" ON "shape" ("asset_id")')
            db.execute_sql('CREATE INDEX "shape_group_id" ON "shape" ("group_id")')
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width, asset_id) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access, is_invisible, default_movement_access, is_locked, angle, stroke_width, asset_id FROM _shape_45'
            )

            data = db.execute_sql("SELECT uuid, badge, options FROM shape")
            pending_groups = {}
            created_groups = {}
            for row in data.fetchall():
                uuid, badge, options = row
                group_id = None
                if options:
                    try:
                        options = dict(json.loads(options))
                    except:
                        logger.error(
                            f"Could not read options for {uuid}, skipping this shape"
                        )
                        continue
                    if "groupInfo" in options:
                        # create new group
                        group_id = str(uuid4())
                        db.execute_sql(
                            "INSERT INTO 'group' (uuid, character_set, creation_order) VALUES (?, ?, ?)",
                            (group_id, "0,1,2,3,4,5,6,7,8,9", "incrementing"),
                        )
                        created_groups[uuid] = group_id
                        # process everything in pending_groups
                        if uuid in pending_groups:
                            for member in pending_groups[uuid]:
                                db.execute_sql(
                                    "UPDATE shape SET group_id = ? WHERE uuid = ?",
                                    (group_id, member),
                                )
                            del pending_groups[uuid]
                        del options["groupInfo"]
                    if "groupId" in options:
                        if options["groupId"] in created_groups:
                            # add to existing group
                            group_id = created_groups[options["groupId"]]
                        else:
                            # remember this shape as something to add later
                            if options["groupId"] not in pending_groups:
                                pending_groups[options["groupId"]] = []
                            pending_groups[options["groupId"]].append(uuid)
                        del options["groupId"]
                    options = json.dumps([[k, v] for k, v in options.items()])
                if badge:
                    badge -= 1
                db.execute_sql(
                    "UPDATE shape SET options = ?, badge = ?, group_id = ? WHERE uuid = ?",
                    (options, badge, group_id, uuid),
                )
    elif version == 46:
        # Add Composite Shape Association and Toggle Shape tables
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "composite_shape_association" ("id" INTEGER NOT NULL PRIMARY KEY, "variant_id" TEXT NOT NULL, "parent_id" TEXT NOT NULL, "name" TEXT NOT NULL, FOREIGN KEY ("variant_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE, FOREIGN KEY ("parent_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "composite_shape_association_variant_id" ON "composite_shape_association" ("variant_id")'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "composite_shape_association_parent_id" ON "composite_shape_association" ("parent_id")'
            )

            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "toggle_composite" ("shape_id" TEXT NOT NULL PRIMARY KEY, "active_variant" TEXT, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid"))'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "toggle_composite_shape_id" ON "toggle_composite" ("shape_id")'
            )
    elif version == 47:
        # Fix ToggleComposite skipDraw type (from string to boolean)
        with db.atomic():
            data = db.execute_sql("SELECT uuid, options FROM shape")
            for row in data.fetchall():
                uuid, options = row
                if options:
                    try:
                        options = dict(json.loads(options))
                    except:
                        logger.error(
                            f"Could not read options for {uuid}, skipping this shape"
                        )
                        continue
                    if options.get("skipDraw", False) == "true":
                        options["skipDraw"] = True
                        options = json.dumps([[k, v] for k, v in options.items()])
                        db.execute_sql(
                            "UPDATE shape SET options = ? WHERE uuid = ?",
                            (options, uuid),
                        )
    elif version == 48:
        # Add Shape.annotation_visible
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN annotation_visible INTEGER NOT NULL DEFAULT 0"
            )
    elif version == 49:
        # Extend Aura
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE aura ADD COLUMN active INTEGER NOT NULL DEFAULT 1"
            )
            db.execute_sql(
                "ALTER TABLE aura ADD COLUMN border_colour TEXT NOT NULL DEFAULT 'rgba(0,0,0,0)'"
            )
            db.execute_sql(
                "ALTER TABLE aura ADD COLUMN angle INTEGER NOT NULL DEFAULT 360"
            )
            db.execute_sql(
                "ALTER TABLE aura ADD COLUMN direction INTEGER NOT NULL DEFAULT 0"
            )
    elif version == 50:
        # Add Location.archived
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE location ADD COLUMN archived INTEGER NOT NULL DEFAULT 0"
            )
    elif version == 51:
        # Add Circle.viewing_angle
        with db.atomic():
            db.execute_sql("ALTER TABLE circle ADD COLUMN viewing_angle REAL")
            db.execute_sql("ALTER TABLE circular_token ADD COLUMN viewing_angle REAL")
    elif version == 52:
        # Move user customisable settings to a separate UserOptions table
        # Add a default_options field to User and user_options to PlayerRoom

        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "user_options" ("id" INTEGER NOT NULL PRIMARY KEY, "fow_colour" TEXT DEFAULT "#000", "grid_colour" TEXT DEFAULT "#000", "ruler_colour" TEXT DEFAULT "#F00", "invert_alt" INTEGER DEFAULT 0, "grid_size" INTEGER DEFAULT 50)'
            )

            # Add PlayerRoom.user_options
            db.execute_sql(
                "CREATE TEMPORARY TABLE _player_room_52 AS SELECT * FROM player_room"
            )
            db.execute_sql("DROP TABLE player_room")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "player_room" ("id" INTEGER NOT NULL PRIMARY KEY, "role" INTEGER DEFAULT 0, "player_id" INTEGER NOT NULL, "room_id" INTEGER NOT NULL, "active_location_id" INTEGER NOT NULL, "user_options_id" INTEGER, FOREIGN KEY ("player_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("active_location_id") REFERENCES "location" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_options_id") REFERENCES "user_options" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                "INSERT INTO player_room (id, role, player_id, room_id, active_location_id) SELECT id, role, player_id, room_id, active_location_id FROM _player_room_52"
            )

            # Add User.default_options
            db.execute_sql("CREATE TEMPORARY TABLE _user_52 AS SELECT * FROM user")
            db.execute_sql("DROP TABLE user")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "user" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT, "password_hash" TEXT NOT NULL, "default_options_id" INTEGER NOT NULL, FOREIGN KEY ("default_options_id") REFERENCES "user_options" ("id") ON DELETE CASCADE)'
            )

            data = db.execute_sql("SELECT * FROM _user_52")
            for row in data.fetchall():
                (
                    id_,
                    name,
                    email,
                    password_hash,
                    fow_colour,
                    grid_colour,
                    ruler_colour,
                    invert_alt,
                    grid_size,
                ) = row
                default_id = db.execute_sql(
                    "INSERT INTO user_options (fow_colour, grid_colour, ruler_colour, invert_alt, grid_size) VALUES (?, ?, ?, ?, ?)",
                    (fow_colour, grid_colour, ruler_colour, invert_alt, grid_size),
                ).lastrowid
                db.execute_sql(
                    "INSERT INTO user (id, name, email, password_hash, default_options_id) VALUES (?, ?, ?, ?, ?)",
                    (id_, name, email, password_hash, default_id),
                )

            db.execute_sql("DROP TABLE _player_room_52")
            db.execute_sql("DROP TABLE _user_52")
    elif version == 53:
        # Add UserOptions.disable_scroll_to_zoom
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE user_options ADD COLUMN disable_scroll_to_zoom INTEGER DEFAULT 0"
            )
            data = db.execute_sql(
                "UPDATE user_options SET disable_scroll_to_zoom = NULL WHERE id NOT IN (SELECT default_options_id FROM user)"
            )
    elif version == 54:
        # Add Shape.ignore_zoom_size
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN ignore_zoom_size INTEGER DEFAULT 0"
            )
    elif version == 55:
        # Remove Text.font and add Text.font_size
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _text_55 AS SELECT * FROM text")
            db.execute_sql("DROP TABLE text")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "text" ("shape_id" TEXT NOT NULL PRIMARY KEY, "text" TEXT NOT NULL, "font_size" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE);'
            )
            db.execute_sql(
                "INSERT INTO text (shape_id, text, font_size) SELECT shape_id, text, 20 FROM _text_55"
            )

    elif version == 56:
        # Add defeated toggle to shapes
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_defeated INTEGER NOT NULL DEFAULT 0"
            )
    elif version == 57:
        # Add Room.logo, PlayerRoom.notes and PlayerRoom.last_played
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _room_57 AS SELECT * FROM room")
            db.execute_sql("DROP TABLE room")
            db.execute_sql(
                'CREATE TABLE "room" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "creator_id" INTEGER NOT NULL, "invitation_code" TEXT NOT NULL, "is_locked" INTEGER NOT NULL, "default_options_id" INTEGER NOT NULL, "logo_id" INTEGER, FOREIGN KEY ("creator_id") REFERENCES "user" ("id") ON DELETE CASCADE, FOREIGN KEY ("default_options_id") REFERENCES "location_options" ("id") ON DELETE CASCADE, FOREIGN KEY ("logo_id") REFERENCES "asset" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'INSERT INTO "room" ("id", name, creator_id, invitation_code, is_locked, default_options_id) SELECT "id", name, creator_id, invitation_code, is_locked, default_options_id FROM _room_57'
            )

            db.execute_sql(
                'ALTER TABLE player_room ADD COLUMN notes TEXT NOT NULL DEFAULT ""'
            )
            db.execute_sql("ALTER TABLE player_room ADD COLUMN last_played TEXT")
    else:
        raise UnknownVersionException(
            f"No upgrade code for save format {version} was found."
        )
    inc_save_version()
    db.foreign_keys = True


def check_save():
    if not os.path.isfile(SAVE_FILE):
        logger.warning("Provided save file does not exist.  Creating a new one.")
        db.create_tables(ALL_MODELS)
        Constants.create(
            save_version=SAVE_VERSION,
            secret_token=secrets.token_bytes(32),
            api_token=secrets.token_hex(32),
        )
    else:
        try:
            save_version = get_save_version()
        except:
            logger.error(
                "Database does not conform to expected format. Failed to start."
            )
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
            backup_path = (
                save_backups.resolve() / f"{Path(SAVE_FILE).name}.{save_version}"
            )
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
