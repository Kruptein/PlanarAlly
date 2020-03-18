import json
import logging
import os
import secrets
import shutil
import sys

from peewee import FloatField, OperationalError
from playhouse.migrate import fn, migrate, SqliteMigrator

from config import SAVE_FILE
from models import ALL_MODELS, Constants
from models.db import db

SAVE_VERSION = 21
logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)


def upgrade(version):
    if version == 3:
        from models import GridLayer

        db.execute_sql("CREATE TEMPORARY TABLE _grid_layer AS SELECT * FROM grid_layer")
        db.drop_tables([GridLayer])
        db.create_tables([GridLayer])
        db.execute_sql("INSERT INTO grid_layer SELECT * FROM _grid_layer")
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 4:
        from models import Location

        db.foreign_keys = False
        db.execute_sql("CREATE TEMPORARY TABLE _location AS SELECT * FROM location")
        db.execute_sql("DROP TABLE location")
        db.create_tables([Location])
        db.execute_sql("INSERT INTO location SELECT * FROM _location")
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 5:
        from models import Layer
        from peewee import ForeignKeyField

        migrator = SqliteMigrator(db)
        field = ForeignKeyField(Layer, Layer.id, backref="active_users", null=True)
        with db.atomic():
            migrate(
                migrator.add_column("location_user_option", "active_layer_id", field)
            )
            from models import LocationUserOption

            LocationUserOption._meta.add_field("active_layer", field)
            for luo in LocationUserOption.select():
                luo.active_layer = luo.location.layers.select().where(
                    Layer.name == "tokens"
                )[0]
                luo.save()
            migrate(migrator.add_not_null("location_user_option", "active_layer_id"))
            Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 6:
        migrator = SqliteMigrator(db)
        migrate(migrator.drop_not_null("location_user_option", "active_layer_id"))
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 7:
        # Remove shape index unique constraint
        from models import Shape

        db.foreign_keys = False
        db.execute_sql("CREATE TEMPORARY TABLE _shape AS SELECT * FROM shape")
        db.execute_sql("DROP TABLE shape")
        db.create_tables([Shape])
        db.execute_sql("INSERT INTO shape SELECT * FROM _shape")
        db.foreign_keys = True
        # Check all indices and reset to 0 index
        logger.info("Validating all shape indices")
        from models import Layer

        with db.atomic():
            for layer in Layer.select():
                shapes = layer.shapes.order_by(fn.ABS(Shape.index))
                for i, shape in enumerate(shapes):
                    shape.index = i
                    shape.save()
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 8:
        from models import Polygon

        db.create_tables([Polygon])
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 9:
        from models import Location

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(
                migrator.add_column("location", "vision_mode", Location.vision_mode),
                migrator.add_column(
                    "location", "vision_min_range", Location.vision_min_range
                ),
                migrator.add_column(
                    "location", "vision_max_range", Location.vision_max_range
                ),
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 10:
        from models import Shape

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(migrator.add_column("shape", "name_visible", Shape.name_visible))
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 11:
        from models import Label, LocationUserOption, ShapeLabel

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            db.create_tables([Label, ShapeLabel])
            migrate(
                migrator.add_column(
                    "location_user_option",
                    "active_filters",
                    LocationUserOption.active_filters,
                )
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 12:
        from models import Label, LabelSelection

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            try:
                migrate(migrator.add_column("label", "category", Label.category))
            except OperationalError as e:
                if e.args[0] != "duplicate column name: category":
                    raise e
            db.create_tables([LabelSelection])
        with db.atomic():
            for label in Label:
                if ":" not in label.name:
                    continue
                cat, *name = label.name.split(":")
                label.category = cat
                label.name = ":".join(name)
                label.save()
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 13:
        from models import LocationUserOption, MultiLine, Polygon

        db.foreign_keys = False
        migrator = SqliteMigrator(db)

        migrate(migrator.drop_column("location_user_option", "active_filters"))

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 14:
        db.foreign_keys = False
        migrator = SqliteMigrator(db)

        from models import GridLayer, Layer

        db.execute_sql(
            'CREATE TABLE IF NOT EXISTS "base_rect" ("shape_id" TEXT NOT NULL PRIMARY KEY, "width" REAL NOT NULL, "height" REAL NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
        )
        db.execute_sql(
            'CREATE TABLE IF NOT EXISTS "shape_type" ("shape_id" TEXT NOT NULL PRIMARY KEY, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)'
        )

        shape_types = [
            "asset_rect",
            "circle",
            "circular_token",
            "line",
            "multi_line",
            "polygon",
            "rect",
            "text",
        ]
        with db.atomic():
            for table in shape_types:
                db.execute_sql(
                    f"CREATE TEMPORARY TABLE _{table} AS SELECT * FROM {table}"
                )
                db.execute_sql(f"DROP TABLE {table}")
            for query in [
                'CREATE TABLE IF NOT EXISTS "asset_rect" ("shape_id" TEXT NOT NULL PRIMARY KEY, "width" REAL NOT NULL, "height" REAL NOT NULL, "src" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "circle" ("shape_id" TEXT NOT NULL PRIMARY KEY, "radius" REAL NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "circular_token" ("shape_id" TEXT NOT NULL PRIMARY KEY, "radius" REAL NOT NULL, "text" TEXT NOT NULL, "font" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "line" ("shape_id" TEXT NOT NULL PRIMARY KEY, "x2" REAL NOT NULL, "y2" REAL NOT NULL, "line_width" INTEGER NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "multi_line" ("shape_id" TEXT NOT NULL PRIMARY KEY, "line_width" INTEGER NOT NULL, "points" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "polygon" ("shape_id" TEXT NOT NULL PRIMARY KEY, "vertices" TEXT NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "rect" ("shape_id" TEXT NOT NULL PRIMARY KEY, "width" REAL NOT NULL, "height" REAL NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
                'CREATE TABLE IF NOT EXISTS "text" ("shape_id" TEXT NOT NULL PRIMARY KEY, "text" TEXT NOT NULL, "font" TEXT NOT NULL, "angle" REAL NOT NULL, FOREIGN KEY ("shape_id") REFERENCES "shape" ("uuid") ON DELETE CASCADE)',
            ]:
                db.execute_sql(query)
            for table in shape_types:
                db.execute_sql(
                    f"INSERT INTO {table} SELECT _{table}.* FROM _{table} INNER JOIN shape ON shape.uuid = _{table}.uuid"
                )
        field = ForeignKeyField(Layer, Layer.id, null=True)
        with db.atomic():
            migrate(migrator.add_column("grid_layer", "layer_id", field))
            for gl in GridLayer.select():
                l = Layer.get_or_none(id=gl.id)
                if l:
                    gl.layer = l
                    gl.save()
                else:
                    gl.delete_instance()
            migrate(migrator.add_not_null("grid_layer", "layer_id"))

        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 15:
        from peewee import BooleanField

        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column("room", "is_locked", BooleanField(default=False))
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 16:
        from peewee import TextField

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
        from peewee import BooleanField, IntegerField

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
        from peewee import TextField

        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(migrator.add_column("user", "email", TextField(null=True)))
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    elif version == 19:
        from peewee import ForeignKeyField

        db.foreign_keys = False
        migrator = SqliteMigrator(db)

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
        from peewee import BooleanField, BooleanField, IntegerField

        migrator = SqliteMigrator(db)
        db.foreign_keys = False
        with db.atomic():
            migrate(
                migrator.add_column("shape", "badge", IntegerField(default=1)),
                migrator.add_column("shape", "show_badge", BooleanField(default=False)),
            )
        db.foreign_keys = True
        Constants.get().update(save_version=Constants.save_version + 1).execute()
    else:
        raise Exception(f"No upgrade code for save format {version} was found.")


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
