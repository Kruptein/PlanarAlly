import sys
from pathlib import Path


def all_subclasses(cls):
    return set(cls.__subclasses__()).union(
        [s for c in cls.__subclasses__() for s in all_subclasses(c)]
    )


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


def get_asset_hash_subpath(file_hash: str) -> Path:
    return Path(file_hash[:2]) / Path(file_hash[2:4]) / Path(file_hash)


SRC_DIR = get_src_dir()
FILE_DIR = SRC_DIR.parent
STATIC_DIR = FILE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "assets"
TEMP_DIR = STATIC_DIR / "temp"
SAVE_DIR = get_save_dir()


for folder in [ASSETS_DIR, TEMP_DIR]:
    if not folder.exists():
        folder.mkdir()


class OldVersionException(Exception):
    pass


class UnknownVersionException(Exception):
    pass
