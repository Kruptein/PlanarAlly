import logging
import os
import secrets
import sys

from config import SAVE_FILE
from db import db
from models import ALL_MODELS, Constants

SAVE_VERSION = 3
logger: logging.Logger = logging.getLogger('PlanarAllyServer')


def check_save():
    if not os.path.isfile(SAVE_FILE):
        logger.warning(
            "Provided save file does not exist.  Creating a new one.")
        db.create_tables(ALL_MODELS)
        Constants.create(save_version=SAVE_VERSION,
                         secret_token=secrets.token_bytes(32))
    else:
        constants = Constants.get_or_none()
        if constants is None:
            logger.error(
                "Database does not conform to expected format. Failed to start.")
            sys.exit(2)
        if constants.save_version != SAVE_VERSION:
            logger.warning(
                f"Save version {constants.save_version} does not match expected {SAVE_VERSION}!")
            logger.info(
                "Conversion scripts can potentially be applied to upgrade.  For more information see the docs.")
            sys.exit(2)
