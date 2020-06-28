import configparser

from utils import FILE_DIR

config = configparser.ConfigParser()
config.read([FILE_DIR / "server_config.cfg", FILE_DIR / "data" / "server_config.cfg"])

SAVE_FILE = config.get('Database', 'db_name') + ".sqlite"
DB_TYPE = config.get('Database', 'db_type', fallback="sqlite")

if not SAVE_FILE.startswith("/"):
    SAVE_FILE = str(FILE_DIR / SAVE_FILE)
