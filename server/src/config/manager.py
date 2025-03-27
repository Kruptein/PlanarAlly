import os
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable, Dict

import rtoml
from pydantic import ValidationError
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from ..utils import set_save_path
from .types import ServerConfig


class ConfigFileHandler(FileSystemEventHandler):
    def __init__(self, callback: Callable[[], Any]):
        self.callback = callback
        self._last_modified = 0

    def on_modified(self, event):
        src = os.fsdecode(event.src_path)
        if src.endswith("config.toml"):
            current_time = datetime.now(UTC).timestamp()
            if current_time - self._last_modified > 1:
                self._last_modified = current_time
                self.callback()


class ConfigManager:
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = ServerConfig()
        self._file_observer = Observer()

        self.load_config(startup=True)

        # Setup file watching
        event_handler = ConfigFileHandler(self.load_config)
        self._file_observer.schedule(
            event_handler, str(self.config_path.parent), recursive=False
        )
        self._file_observer.start()

    def load_config(self, *, startup=False) -> None:
        """Load configuration from file"""
        try:
            if self.config_path.exists():
                config_data = rtoml.loads(self.config_path.read_text())
                self.config = ServerConfig(**config_data)
                set_save_path(self.config.general.save_file)

                if not startup:
                    from ..logs import logger

                    logger.info("Config file changed, reloading")
        except rtoml.TomlParsingError as e:
            print(f"Error loading config: {e}")
        except ValidationError as e:
            print(f"Error validating config: {e}")
            if startup:
                sys.exit(1)

    def save_config(self) -> None:
        """Save current config to file (debounced)"""
        from ..logs import logger

        logger.info("Saving config")
        try:
            config_dict = self.config.dict()
            update_time = datetime.now(UTC).isoformat()
            self.config_path.write_text(
                f"# Last updated from UI at {update_time}\n{rtoml.dumps(config_dict, none_value=None)}"
            )
        except Exception as e:
            logger.error(f"Error saving config: {e}")

    def update_config(self, updates: Dict[str, Any]) -> None:
        """Update config with new values"""
        try:
            # Create new config with updates
            new_config = ServerConfig(**(self.config.dict() | updates))
            self.config = new_config

            # Save and notify
            self.save_config()
        except ValidationError as e:
            raise ValueError(f"Invalid configuration: {e}")

    def cleanup(self) -> None:
        """Cleanup resources"""
        if self._file_observer.is_alive():
            self._file_observer.stop()
            self._file_observer.join()
