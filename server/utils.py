import logging
import os
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

# SETUP PATHS
os.chdir(FILE_DIR)

# SETUP LOGGING

logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(str(FILE_DIR / "planarallyserver.log"))
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
)
file_handler.setFormatter(formatter)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)


class OldVersionException(Exception):
    pass


class UnknownVersionException(Exception):
    pass
