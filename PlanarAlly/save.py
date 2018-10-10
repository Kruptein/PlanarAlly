import os
import secrets
import sys

from config import SAVE_FILE
from models import db, ALL_MODELS, General

SAVE_VERSION = 3

def check_save():
    if not os.path.isfile(SAVE_FILE):
        print("Provided save file does not exist.  Creating a new one.")
        db.create_tables(ALL_MODELS)
        General.create(save_version=SAVE_VERSION, secret_token=secrets.token_bytes(32))
    else:
        general = General.get_or_none(1)
        if general is None:
            print("Database does not conform to expected format. Failed to start.")
            sys.exit(2)
        if general.save_version != SAVE_VERSION:
            print(f"Save version {general.save_version} does not match expected {SAVE_VERSION}!")
            print("Conversion scripts can potentially be applied to upgrade.  For more information see the docs.")
            sys.exit(2)
