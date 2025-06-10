import os
import sys
from pathlib import Path


def all_subclasses(cls):
    return set(cls.__subclasses__()).union([s for c in cls.__subclasses__() for s in all_subclasses(c)])


def get_src_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve()
    return Path(__file__).resolve().parent


def get_save_dir() -> Path:
    return FILE_DIR


def set_assets_dir(assets_dir: Path):
    global ASSETS_DIR
    ASSETS_DIR = assets_dir

    if not ASSETS_DIR.exists():
        ASSETS_DIR.mkdir()


def set_save_path(save_path: Path | str):
    global SAVE_PATH
    if isinstance(save_path, str):
        if save_path.startswith("/"):
            save_path = Path(save_path)
        else:
            save_path = FILE_DIR / save_path
    SAVE_PATH = save_path


def get_asset_hash_subpath(file_hash: str) -> Path:
    return Path(file_hash[:2]) / Path(file_hash[2:4]) / Path(file_hash)


# Root code directory
SRC_DIR = get_src_dir()
# Root server directory
FILE_DIR = SRC_DIR.parent
# Data - config, save files etc
DATA_DIR = FILE_DIR / "data"
# Config - can be overridden by environment variable
CONFIG_PATH = Path(os.environ.get("PA_CONFIG_PATH", DATA_DIR / "config.toml"))
SAVE_PATH = DATA_DIR / "planar.sqlite"


STATIC_DIR = FILE_DIR / "static"
# Uploaded user assets
ASSETS_DIR = STATIC_DIR / "assets"
# Temporary files - pending uploads, exports etc
TEMP_DIR = STATIC_DIR / "temp"
MODS_DIR = STATIC_DIR / "mods"


for folder in [ASSETS_DIR, DATA_DIR, TEMP_DIR]:
    if not folder.exists():
        folder.mkdir()


class OldVersionException(Exception):
    pass


class UnknownVersionException(Exception):
    pass
