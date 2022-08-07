import configparser
from pathlib import Path

from .utils import FILE_DIR, SAVE_DIR, set_assets_dir

config = configparser.ConfigParser()
config.read([FILE_DIR / "server_config.cfg", FILE_DIR / "data" / "server_config.cfg"])

save_path = config["General"]["save_file"]

if save_path.startswith("/"):
    SAVE_FILE = Path(save_path)
else:
    SAVE_FILE = SAVE_DIR / save_path

assets_path = config["General"].get("assets_directory")
if assets_path is not None:
    set_assets_dir(Path(assets_path))
