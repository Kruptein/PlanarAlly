import logging
import sys
from logging.handlers import RotatingFileHandler

from .config import cfg
from .utils import FILE_DIR

# SETUP LOGGING

config = cfg()

# Initialize the main logger destination
logger = logging.getLogger("PlanarAllyServer")
# Set the logging level based on configuration
logger.setLevel(config.logging.level)
# Define the log message format
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)")

# Initialize the stream handler for logging to stdout if enabled, always at least log to stdout even if no destinations are set
if "stdout" in config.logging.destinations or not config.logging.destinations:
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

# Initialize the file handler for logging
if "file" in config.logging.destinations:
    # Check the logging file path from configuration to see if its absolute
    log_file_path = config.logging.file_path
    if not log_file_path.startswith("/") and not log_file_path[1:3] == ":\\":  # Windows drive letter check
        log_file_path = str(FILE_DIR / log_file_path)
    maxBytes = config.logging.max_log_size_in_bytes or config.general.max_log_size_in_bytes
    backupCount = config.logging.max_log_backups or config.general.max_log_backups
    file_handler = RotatingFileHandler(filename=log_file_path, maxBytes=maxBytes, backupCount=backupCount)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)


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
