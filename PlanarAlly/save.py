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
        General.get(1).save_version
    # try:
    #     shelf = shelve.open(save_file, 'r')
    # except dbm.error:
    #     print("Provided save file does not exist. Creating a new one.")
    #     shelf = shelve.open(save_file, 'c')
    #     shelf['save_version'] = SAVE_VERSION
    # else:
    #     if "save_version" not in shelf:
    #         print("Save file has no save version. Cannot open.")
    #         sys.exit(2)
    #     if shelf['save_version'] != SAVE_VERSION:
    #         print("Save version {} does not match the expected {}".format(shelf['save_version'], SAVE_VERSION))
    #         print("If available you can try to convert the save_formats using the conversion scripts.")
    #         sys.exit(2)
