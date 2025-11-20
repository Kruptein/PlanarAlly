import logging
import sys

from typing import cast
from pathlib import Path
from logging.handlers import RotatingFileHandler


from .config import cfg
from .utils import FILE_DIR
from .config.types import FileLoggingConfig

# SETUP LOGGING

config = cfg()

level_mapping = logging.getLevelNamesMapping()
logger = logging.getLogger("PlanarAllyServer")

set_stdout = False

formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)")

if not config.logging:
    # Write to standard out there is no logger configured
    print("No logging configuration found. There will be no logging output")
    # Supress the default stream handler
    logger.addHandler(logging.NullHandler())

for log_config in config.logging:
    # Set the root log level to the lowest level among handlers
    # Otherwise it defaults to WARNING and removes lower level logs
    if level_mapping.get(logger.level, logging.INFO) > level_mapping.get(log_config.level, logging.INFO):
        logger.setLevel(log_config.level)
    match log_config.mode:
        case "stdout":
            if set_stdout:
                logger.warning("Multiple stdout logging handlers configured, ignoring extras")
                continue
            set_stdout = True
            stream_handler = logging.StreamHandler(sys.stdout)
            stream_handler.setLevel(log_config.level)
            stream_handler.setFormatter(formatter)
            logger.addHandler(stream_handler)
        case "file":
            file_config = cast(FileLoggingConfig, log_config)
            path = Path(file_config.file_path)
            if not path.is_absolute():
                log_file_path = str(FILE_DIR / file_config.file_path)
            else:
                log_file_path = file_config.file_path
            maxBytes = file_config.max_log_size_in_bytes
            backupCount = file_config.max_log_backups
            file_handler = RotatingFileHandler(filename=log_file_path, maxBytes=maxBytes, backupCount=backupCount)
            file_handler.setLevel(file_config.level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

logger.debug("Logger initialized with {} handler(s)".format(len(logger.handlers)))


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
