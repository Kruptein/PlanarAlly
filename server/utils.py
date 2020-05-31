import sys
from pathlib import Path


def all_subclasses(cls):
    return set(cls.__subclasses__()).union(
        [s for c in cls.__subclasses__() for s in all_subclasses(c)]
    )


def get_file_dir():
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


FILE_DIR = get_file_dir()


class OldVersionException(Exception):
    pass


class UnknownVersionException(Exception):
    pass
