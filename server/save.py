import logging
import os
import secrets
import shutil
import sys

from peewee import FloatField
from playhouse.migrate import *

from config import SAVE_FILE
from models import ALL_MODELS, Constants
from models.db import db

SAVE_VERSION = 10
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
