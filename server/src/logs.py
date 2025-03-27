import logging
import sys
from logging.handlers import RotatingFileHandler

from .config import cfg
from .utils import FILE_DIR

# SETUP LOGGING

logger = logging.getLogger("PlanarAllyServer")
logger.setLevel(logging.INFO)
file_handler = RotatingFileHandler(
    str(FILE_DIR / "planarallyserver.log"),
    maxBytes=cfg().general.max_log_size_in_bytes,
    backupCount=cfg().general.max_log_backups,
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


def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    logger.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))


def handle_async_exception(loop, context):
    msg = context.get("exception", context["message"])
    logger.critical(f"Uncaught async exception {msg}")
    loop.default_exception_handler(context)


sys.excepthook = handle_exception
