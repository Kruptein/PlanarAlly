import logging
import sys
from logging.handlers import RotatingFileHandler

from config import config
from utils import FILE_DIR

# SETUP LOGGING

logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)
file_handler = RotatingFileHandler(
    str(FILE_DIR / "planarallyserver.log"),
    maxBytes=config.getint("General", "max_log_size_in_bytes"),
    backupCount=config.getint("General", "max_log_backups"),
)
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
)
file_handler.setFormatter(formatter)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)
