from ..utils import CONFIG_PATH
from .manager import ConfigManager

config_manager = ConfigManager(CONFIG_PATH)


# Shortcut helper
# This needs to be a function to ensure that the config is up to date
# Otherwise, updates would not be reflected if they change the pointer
def cfg():
    return config_manager.config
