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

SAVE_VERSION = 5
logger: logging.Logger = logging.getLogger("PlanarAllyServer")


def upgrade(version):
    if version == 3:
        from models import GridLayer
        db.execute_sql(
            "CREATE TEMPORARY TABLE _grid_layer AS SELECT * FROM grid_layer")
        db.drop_tables([GridLayer])
        db.create_tables([GridLayer])
        db.execute_sql("INSERT INTO grid_layer SELECT * FROM _grid_layer")
        Constants.update(save_version=Constants.save_version + 1).execute()
    elif version == 4:
        from models import Location
        db.foreign_keys = False
        db.execute_sql(
            "CREATE TEMPORARY TABLE _location AS SELECT * FROM location")
        db.execute_sql("DROP TABLE location")
        db.create_tables([Location])
        db.execute_sql("INSERT INTO location SELECT * FROM _location")
        db.foreign_keys = True
        Constants.update(save_version=Constants.save_version + 1).execute()
    else:
        raise Exception(
            f"No upgrade code for save format {version} was found.")


def check_save():
    if not os.path.isfile(SAVE_FILE):
        logger.warning(
            "Provided save file does not exist.  Creating a new one.")
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
                f"Save format {constants.save_version} does not match the required version {SAVE_VERSION}!")
            logger.warning("Attempting upgrade")
        while constants.save_version != SAVE_VERSION:
            logger.warning(
                f"Backing up old save as {SAVE_FILE}.{constants.save_version}")
            shutil.copyfile(SAVE_FILE, f"{SAVE_FILE}.{constants.save_version}")
            logger.warning(f"Starting upgrade to {constants.save_version + 1}")
            try:
                upgrade(constants.save_version)
            except Exception as e:
                logger.warning(e)
                logger.error("ERROR: Could not start server")
                sys.exit(2)
                break
            else:
                logger.warning(
                    f"Upgrade to {constants.save_version + 1} done.")
                constants = Constants.get()
        else:
            logger.warning("Upgrade process completed successfully.")
