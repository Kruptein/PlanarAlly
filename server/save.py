import json
import logging
import os
import secrets
import shutil
import sys

from peewee import FloatField, OperationalError
from playhouse.migrate import *

from config import SAVE_FILE
from models import ALL_MODELS, Constants
from models.db import db

SAVE_VERSION = 15
logger: logging.Logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)


def upgrade(version):
    if version == 3:
        from models import GridLayer

        db.execute_sql("CREATE TEMPORARY TABLE _grid_layer AS SELECT * FROM grid_layer")
        db.drop_tables([GridLayer])
        db.create_tables([GridLayer])
        db.execute_sql("INSERT INTO grid_layer SELECT * FROM _grid_layer")
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 4:
        from models import Location

        db.foreign_keys = False
        db.execute_sql("CREATE TEMPORARY TABLE _location AS SELECT * FROM location")
        db.execute_sql("DROP TABLE location")
        db.create_tables([Location])
        db.execute_sql("INSERT INTO location SELECT * FROM _location")
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 5:
        from models import Layer

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
            Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 6:
        migrator = SqliteMigrator(db)
        migrate(migrator.drop_not_null("location_user_option", "active_layer_id"))
        Constants.update(save_version=Constants.save_version + 1).execute()
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
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 8:
        from models import Polygon

        db.create_tables([Polygon])
        Constants.update(save_version=Constants.save_version + 1).execute()
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
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 10:
        from models import Shape

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            migrate(migrator.add_column("shape", "name_visible", Shape.name_visible))
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 11:
        from models import Label, LocationUserOption, ShapeLabel

        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        with db.atomic():
            db.create_tables([Label, ShapeLabel])
            migrate(migrator.add_column("location_user_option", "active_filters", LocationUserOption.active_filters))
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
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
                if ":" not in label.name: continue
                cat, *name = label.name.split(":")
                label.category = cat
                label.name = ':'.join(name)
                label.save()
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 13:
        from models import LocationUserOption, MultiLine, Polygon
        
        db.foreign_keys = False
        migrator = SqliteMigrator(db)
        
        migrate(migrator.drop_column("location_user_option", "active_filters"))
        
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 14:
        db.foreign_keys = False
        migrator = SqliteMigrator(db)

        from models import Shape

        # field = ForeignKeyField(Shape, Shape.id, null=True)
        # migrate(migrator.add_column("asset_rect", "shape_id", field))
        # migrate(migrator.add_column("circle", "shape_id", field))
        # migrate(migrator.add_column("circular_token", "shape_id", field))
        # migrate(migrator.add_column("line", "shape_id", field))
        # migrate(migrator.add_column("multi_line", "shape_id", field))
        # migrate(migrator.add_column("polygon", "shape_id", field))
        # migrate(migrator.add_column("rect", "shape_id", field))
        # migrate(migrator.add_column("text", "shape_id", field))

        from models import GridLayer, Layer
        from models.shape import ShapeType, BaseRect, AssetRect, Circle, CircularToken, Line, MultiLine, Polygon, Rect, Text
        # from models.utils import get_table

        db.create_tables([ShapeType, BaseRect])
        for table in [AssetRect, Circle, CircularToken, Line, MultiLine, Polygon, Rect, Text]:
            with db.atomic():
                migrate(migrator.rename_column(table._meta.table_name, "uuid", "uuid_id"))
                for subshape in table.select():
                    try:
                        x = subshape.uuid
                    except:
                        db.execute_sql(f"DELETE FROM {subshape._meta.table_name} WHERE UUID_ID={subshape.uuid}")
                #     sh = Shape.get_or_none(uuid=subshape.uuid)
                #     if sh is None:
                #         subshape.delete_instance()
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
        Constants.update(save_version=Constants.save_version + 1).execute()
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
