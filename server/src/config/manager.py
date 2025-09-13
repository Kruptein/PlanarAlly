import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict

import rtoml
from dotenv import load_dotenv
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
            current_time = datetime.now(timezone.utc).timestamp()
            if current_time - self._last_modified > 1:
                self._last_modified = current_time
                self.callback()


class ConfigManager:
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = ServerConfig()
        self._file_observer = Observer()

        # Load .env file if it exists (check both current dir and parent dir)
        env_paths = [Path(".env"), Path("../.env")]
        for env_path in env_paths:
            if env_path.exists():
                load_dotenv(env_path)
                break

        self.load_config(startup=True)

        # Setup file watching
        event_handler = ConfigFileHandler(self.load_config)
        self._file_observer.schedule(event_handler, str(self.config_path.parent), recursive=False)
        self._file_observer.start()

    def load_config(self, *, startup=False) -> None:
        """Load configuration from file and environment variables"""
        try:
            config_data = {}
            
            # Load from file if it exists
            if self.config_path.exists():
                config_data = rtoml.loads(self.config_path.read_text())
            
            # Override with environment variables
            env_overrides = self._load_env_overrides()
            if env_overrides:
                config_data = self._deep_merge(config_data, env_overrides)
            
            self.config = ServerConfig(**config_data)
            set_save_path(self.config.general.save_file)

            if not startup:
                from ..logs import logger
                from ..mail import reset_email

                logger.info("Config file changed, reloading")
                reset_email()
        except rtoml.TomlParsingError as e:
            print(f"Error loading config: {e}")
        except ValidationError as e:
            print(f"Error validating config: {e}")
            if startup:
                sys.exit(1)

    def _load_env_overrides(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables"""
        env_config = {}
        
        # General configuration
        if val := os.getenv("PA_CLIENT_URL"):
            env_config.setdefault("general", {})["client_url"] = val
        if val := os.getenv("PA_ALLOW_SIGNUPS"):
            env_config.setdefault("general", {})["allow_signups"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_USERNAME_PASS"):
            env_config.setdefault("general", {})["username_password_enabled"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_ENABLE_EXPORT"):
            env_config.setdefault("general", {})["enable_export"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_ADMIN_USER"):
            env_config.setdefault("general", {})["admin_user"] = val
        
        # Webserver configuration
        if val := os.getenv("PA_WEBSERVER_HOST"):
            env_config.setdefault("webserver", {}).setdefault("connection", {})["host"] = val
        if val := os.getenv("PA_WEBSERVER_PORT"):
            env_config.setdefault("webserver", {}).setdefault("connection", {})["port"] = int(val)
        if val := os.getenv("PA_CORS_ALLOWED_ORIGINS"):
            env_config.setdefault("webserver", {})["cors_allowed_origins"] = val
        if val := os.getenv("PA_MAX_UPLOAD_SIZE_IN_BYTES"):
            env_config.setdefault("webserver", {})["max_upload_size_in_bytes"] = int(val)
        
        # OIDC configuration
        if val := os.getenv("PA_OIDC_ENABLED"):
            env_config.setdefault("oidc", {})["enabled"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_OIDC_DOMAIN"):
            env_config.setdefault("oidc", {})["domain"] = val
        if val := os.getenv("PA_OIDC_CLIENT_ID"):
            env_config.setdefault("oidc", {})["client_id"] = val
        if val := os.getenv("PA_OIDC_CLIENT_SECRET"):
            env_config.setdefault("oidc", {})["client_secret"] = val
        if val := os.getenv("PA_OIDC_AUDIENCE"):
            env_config.setdefault("oidc", {})["audience"] = val
        if val := os.getenv("PA_OIDC_PROVIDER_NAME"):
            env_config.setdefault("oidc", {})["provider_name"] = val
        if val := os.getenv("PA_OIDC_USERNAME_FIELD"):
            env_config.setdefault("oidc", {})["username_field"] = val
        if val := os.getenv("PA_OIDC_SCOPE"):
            env_config.setdefault("oidc", {})["scope"] = val
        # Direct URL overrides (bypass discovery)
        if val := os.getenv("PA_OIDC_AUTHORIZE_URL"):
            env_config.setdefault("oidc", {})["authorize_url"] = val
        if val := os.getenv("PA_OIDC_TOKEN_URL"):
            env_config.setdefault("oidc", {})["token_url"] = val
        if val := os.getenv("PA_OIDC_USERINFO_URL"):
            env_config.setdefault("oidc", {})["userinfo_url"] = val
        
        
        # Stats configuration
        if val := os.getenv("PA_STATS_ENABLED"):
            env_config.setdefault("stats", {})["enabled"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_STATS_ENABLE_EXPORT"):
            env_config.setdefault("stats", {})["enable_export"] = val.lower() in ("true", "1", "yes")
        if val := os.getenv("PA_STATS_EXPORT_FREQUENCY_IN_SECONDS"):
            env_config.setdefault("stats", {})["export_frequency_in_seconds"] = int(val)
        if val := os.getenv("PA_STATS_URL"):
            env_config.setdefault("stats", {})["stats_url"] = val
        
        return env_config

    def _deep_merge(self, base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two dictionaries"""
        result = base.copy()
        for key, value in updates.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    def save_config(self) -> None:
        """Save current config to file (debounced)"""
        from ..logs import logger

        logger.info("Saving config")
        try:
            config_dict = self.config.dict()
            update_time = datetime.now(timezone.utc).isoformat()
            self.config_path.write_text(
                f"# Last updated from UI at {update_time}\n{rtoml.dumps(config_dict, none_value=None)}"
            )
        except Exception as e:
            logger.error(f"Error saving config: {e}")

    def update_config(self, updates: Dict[str, Any]) -> None:
        """Update config with new values"""
        if "admin_user" in updates:
            raise ValueError("admin_user cannot be updated dynamically for security reasons.")

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
