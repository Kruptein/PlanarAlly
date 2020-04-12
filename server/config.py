import configparser

from utils import FILE_DIR

config = configparser.ConfigParser()
config.read([FILE_DIR / "server_config.cfg", FILE_DIR / "data" / "server_config.cfg"])

SAVE_FILE = config['General']['save_file']

if not SAVE_FILE.startswith("/"):
    SAVE_FILE = str(FILE_DIR / SAVE_FILE)
