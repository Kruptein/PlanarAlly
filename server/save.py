import json
import logging
import os
import secrets
import shutil
import sys

from peewee import (
    BooleanField,
    FloatField,
    ForeignKeyField,
    IntegerField,
    OperationalError,
    TextField,
)
from playhouse.migrate import SqliteMigrator, fn, migrate

from config import SAVE_FILE
from models import ALL_MODELS, Constants
from models.db import db
from utils import OldVersionException, UnknownVersionException

SAVE_VERSION = 32

logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)


def upgrade(version):
    if version < 16:
        raise OldVersionException(
            f"Upgrade code for this version is >1 year old and is no longer in the active codebase to reduce clutter. You can still find this code on github, contact me for more info."
        )
    elif version == 16:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column(
                    "location", "unit_size_unit", TextField(default="ft")
                )
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 17:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column(
                    "polygon", "open_polygon", BooleanField(default=False)
                ),
                migrator.add_column("polygon", "line_width", IntegerField(default=2)),
            )
            db.execute_sql(
                "INSERT INTO polygon (shape_id, line_width, vertices, open_polygon) SELECT shape_id, line_width, points, 1 FROM multi_line"
            )
            db.execute_sql("DROP TABLE multi_line")
            db.execute_sql(
                "UPDATE shape SET type_ = 'polygon' WHERE type_ = 'multiline'"
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 18:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(migrator.add_column("user", "email", TextField(null=True)))
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 19:
        db.foreign_keys = False

        db.execute_sql(
            'CREATE TABLE IF NOT EXISTS "floor" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "name" TEXT, "index" INTEGER NOT NULL, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
        )
        db.execute_sql(
            'INSERT INTO floor (location_id, name, "index") SELECT id, "ground", 0 FROM location'
        )

        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _layer AS SELECT * FROM layer")
            db.execute_sql("DROP TABLE layer")
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "layer" ("id" INTEGER NOT NULL PRIMARY KEY, "floor_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "type_" TEXT NOT NULL, "player_visible" INTEGER NOT NULL, "player_editable" INTEGER NOT NULL, "selectable" INTEGER NOT NULL, "index" INTEGER NOT NULL, FOREIGN KEY ("floor_id") REFERENCES "floor" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'INSERT INTO layer (id, floor_id, name, type_, player_visible, player_editable, selectable, "index") SELECT _layer.id, floor.id, _layer.name, type_, player_visible, player_editable, selectable, _layer."index" FROM _layer INNER JOIN floor ON floor.location_id = _layer.location_id'
            )

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 20:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column("shape", "badge", IntegerField(default=1)),
                migrator.add_column("shape", "show_badge", BooleanField(default=False)),
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 21:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column("user", "invert_alt", BooleanField(default=False))
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 22:
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                'CREATE TABLE IF NOT EXISTS "marker" ("id" INTEGER NOT NULL PRIMARY KEY, "shape_id" TEXT NOT NULL, "user_id" INTEGER NOT NULL, "location_id" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape"("uuid") ON DELETE CASCADE, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE, FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE)'
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 23:
        migrator = SqliteMigrator(db)
        db.foreign_keys = False
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
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 24:
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                'DELETE FROM "player_room" WHERE id IN (SELECT pr.id FROM "player_room" pr INNER JOIN "room" r ON r.id = pr.room_id WHERE r.creator_id = pr.player_id )'
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 25:
        # Move Room.dm_location and Room.player_location to PlayerRoom.active_location
        # Add PlayerRoom.role
        # Add order index on location
        from models import Location

        migrator = SqliteMigrator(db)
        db.foreign_keys = False
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

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 26:
        # Move Location settings to a separate LocationSettings table
        # Add a default_settings field to Room that refers to such a LocationSettings row
        from models import LocationOptions

        migrator = SqliteMigrator(db)

        db.foreign_keys = False
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

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 27:
        # Fix broken schemas from older save upgrades
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql("CREATE TEMPORARY TABLE _floor AS SELECT * FROM floor")
            db.execute_sql("DROP TABLE floor")
            db.execute_sql(
                'CREATE TABLE "floor" ("id" INTEGER NOT NULL PRIMARY KEY, "location_id" INTEGER NOT NULL, "index" INTEGER NOT NULL, "name" TEXT NOT NULL, FOREIGN KEY ("location_id") REFERENCES "location" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "floor_location_id" ON "floor" ("location_id")'
            )
            db.execute_sql(
                'INSERT INTO floor (id, location_id, "index", name) SELECT id, location_id, "index", name FROM _floor'
            )

            db.execute_sql("CREATE TEMPORARY TABLE _label AS SELECT * FROM label")
            db.execute_sql("DROP TABLE label")
            db.execute_sql(
                'CREATE TABLE "label" ("uuid" TEXT NOT NULL PRIMARY KEY, "user_id" INTEGER NOT NULL, "category" TEXT, "name" TEXT NOT NULL, "visible" INTEGER NOT NULL, FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "label_user_id" ON "label" ("user_id")'
            )
            db.execute_sql(
                "INSERT INTO label (uuid, user_id, category, name, visible) SELECT uuid, user_id, category, name, visible FROM _label"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _layer AS SELECT * FROM layer")
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
                'INSERT INTO layer (id, floor_id, name, type_, player_visible, player_editable, selectable, "index") SELECT id, floor_id, name, type_, player_visible, player_editable, selectable, "index" FROM _layer'
            )

            db.execute_sql("CREATE TEMPORARY TABLE _location AS SELECT * FROM location")
            db.execute_sql("DROP TABLE location")
            db.execute_sql(
                'CREATE TABLE "location" ("id" INTEGER NOT NULL PRIMARY KEY, "room_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "options_id" INTEGER, "index" INTEGER NOT NULL, FOREIGN KEY ("room_id") REFERENCES "room" ("id") ON DELETE CASCADE, FOREIGN KEY ("options_id") REFERENCES "location_options" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_room_id" ON "location" ("room_id")'
            )
            db.execute_sql(
                'INSERT INTO location (id, room_id, name, options_id, "index") SELECT id, room_id, name, options_id, "index" FROM _location'
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_options AS SELECT * FROM location_options"
            )
            db.execute_sql("DROP TABLE location_options")
            db.execute_sql(
                'CREATE TABLE "location_options" ("id" INTEGER NOT NULL PRIMARY KEY, "unit_size" REAL, "unit_size_unit" TEXT, "use_grid" INTEGER, "full_fow" INTEGER, "fow_opacity" REAL, "fow_los" INTEGER, "vision_mode" TEXT, "grid_size" INTEGER, "vision_min_range" REAL, "vision_max_range" REAL)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "location_options_id" ON "location" ("options_id")'
            )
            db.execute_sql(
                "INSERT INTO location_options (id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, grid_size, vision_min_range, vision_max_range) SELECT id, unit_size, unit_size_unit, use_grid, full_fow, fow_opacity, fow_los, vision_mode, grid_size, vision_min_range, vision_max_range FROM _location_options"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _location_user_option AS SELECT * FROM location_user_option"
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
                "INSERT INTO location_user_option (id, location_id, user_id, pan_x, pan_y, zoom_factor, active_layer_id) SELECT id, location_id, user_id, pan_x, pan_y, zoom_factor, active_layer_id FROM _location_user_option"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _marker AS SELECT * FROM marker")
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
                "INSERT INTO marker (id, shape_id, user_id, location_id) SELECT id, shape_id, user_id, location_id FROM _marker"
            )

            db.execute_sql(
                "CREATE TEMPORARY TABLE _player_room AS SELECT * FROM player_room"
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
                "INSERT INTO player_room (id, role, player_id, room_id, active_location_id) SELECT id, role, player_id, room_id, active_location_id FROM _player_room"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _polygon AS SELECT * FROM polygon")
            db.execute_sql("DROP TABLE polygon")
            db.execute_sql(
                'CREATE TABLE "polygon" ("shape_id" TEXT NOT NULL PRIMARY KEY, "vertices" TEXT NOT NULL, "line_width" INTEGER NOT NULL, "open_polygon" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
            )
            db.execute_sql(
                "INSERT INTO polygon (shape_id,vertices, line_width, open_polygon) SELECT shape_id,vertices, line_width, open_polygon FROM _polygon"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _room AS SELECT * FROM room")
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
                "INSERT INTO room (id, name, creator_id, invitation_code, is_locked, default_options_id) SELECT id, name, creator_id, invitation_code, is_locked, default_options_id FROM _room"
            )

            db.execute_sql("CREATE TEMPORARY TABLE _shape AS SELECT * FROM shape")
            db.execute_sql("DROP TABLE shape")
            db.execute_sql(
                'CREATE TABLE "shape" ("uuid" TEXT NOT NULL PRIMARY KEY, "layer_id" INTEGER NOT NULL, "type_" TEXT NOT NULL, "x" REAL NOT NULL, "y" REAL NOT NULL, "name" TEXT, "name_visible" INTEGER NOT NULL, "fill_colour" TEXT NOT NULL, "stroke_colour" TEXT NOT NULL, "vision_obstruction" INTEGER NOT NULL, "movement_obstruction" INTEGER NOT NULL, "is_token" INTEGER NOT NULL, "annotation" TEXT NOT NULL, "draw_operator" TEXT NOT NULL, "index" INTEGER NOT NULL, "options" TEXT, "badge" INTEGER NOT NULL, "show_badge" INTEGER NOT NULL, "default_edit_access" INTEGER NOT NULL, "default_vision_access" INTEGER NOT NULL, FOREIGN KEY ("layer_id") REFERENCES "layer" ("id") ON DELETE CASCADE)'
            )
            db.execute_sql(
                'CREATE INDEX IF NOT EXISTS "shape_layer_id" ON "shape" ("layer_id")'
            )
            db.execute_sql(
                'INSERT INTO shape (uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access) SELECT uuid, layer_id, type_, x, y, name, name_visible, fill_colour, stroke_colour, vision_obstruction, movement_obstruction, is_token, annotation, draw_operator, "index", options, badge, show_badge, default_edit_access, default_vision_access FROM _shape'
            )

            db.execute_sql("CREATE TEMPORARY TABLE _user AS SELECT * FROM user")
            db.execute_sql("DROP TABLE user")
            db.execute_sql(
                'CREATE TABLE "user" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT, "password_hash" TEXT NOT NULL, "fow_colour" TEXT NOT NULL, "grid_colour" TEXT NOT NULL, "ruler_colour" TEXT NOT NULL, "invert_alt" INTEGER NOT NULL)'
            )
            db.execute_sql(
                "INSERT INTO user (id, name, email, password_hash, fow_colour, grid_colour, ruler_colour, invert_alt) SELECT id, name, email, password_hash, fow_colour, grid_colour, ruler_colour, invert_alt FROM _user"
            )

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 28:
        # Add invisibility toggle to shapes
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_invisible INTEGER NOT NULL DEFAULT 0"
            )

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 29:
        # Add movement access permission
        migrator = SqliteMigrator(db)

        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN default_movement_access INTEGER NOT NULL DEFAULT 0"
            )
            db.execute_sql("ALTER TABLE shape_owner ADD COLUMN movement_access INTEGER")
            db.execute_sql(
                "UPDATE shape_owner SET movement_access = CASE WHEN edit_access = 0 THEN 0 ELSE 1 END"
            )

            migrate(migrator.add_not_null("shape_owner", "movement_access"),)

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 30:
        # Add spawn locations
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                'ALTER TABLE location_options ADD COLUMN spawn_locations TEXT NOT NULL DEFAULT "[]"'
            )

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 31:
        # Add shape movement lock
        db.foreign_keys = False
        with db.atomic():
            db.execute_sql(
                "ALTER TABLE shape ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0"
            )

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    else:
        raise UnknownVersionException(
            f"No upgrade code for save format {version} was found."
        )


def check_save():
    if not os.path.isfile(SAVE_FILE):
        logger.warning("Provided save file does not exist.  Creating a new one.")
        db.create_tables(ALL_MODELS)
        Constants.create(
            save_version=SAVE_VERSION, secret_token=secrets.token_bytes(32)
        )
    else:
        constants = Constants.get_or_none()
        if constants is None:
            logger.error(
                "Database does not conform to expected format. Failed to start."
            )
            sys.exit(2)
        if constants.save_version != SAVE_VERSION:
            logger.warning(
                f"Save format {constants.save_version} does not match the required version {SAVE_VERSION}!"
            )
            logger.warning("Attempting upgrade")

        updated = False
        while constants.save_version != SAVE_VERSION:
            updated = True
            logger.warning(
                f"Backing up old save as {SAVE_FILE}.{constants.save_version}"
            )
            shutil.copyfile(SAVE_FILE, f"{SAVE_FILE}.{constants.save_version}")
            logger.warning(f"Starting upgrade to {constants.save_version + 1}")
            try:
                upgrade(constants.save_version)
            except Exception as e:
                logger.exception(e)
                logger.error("ERROR: Could not start server")
                sys.exit(2)
                break
            else:
                logger.warning(f"Upgrade to {constants.save_version + 1} done.")
                constants = Constants.get()
        else:
            if updated:
                logger.warning("Upgrade process completed successfully.")
