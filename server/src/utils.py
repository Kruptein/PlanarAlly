import os
import sys
from pathlib import Path


def all_subclasses(cls):
    return set(cls.__subclasses__()).union(
        [s for c in cls.__subclasses__() for s in all_subclasses(c)]
    )


def get_src_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def get_save_dir() -> Path:
    return FILE_DIR


SRC_DIR = get_src_dir()
FILE_DIR = SRC_DIR.parent
STATIC_DIR = FILE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "assets"
TEMP_DIR = STATIC_DIR / "temp"
SAVE_DIR = get_save_dir()


class OldVersionException(Exception):
    pass


class UnknownVersionException(Exception):
    pass
