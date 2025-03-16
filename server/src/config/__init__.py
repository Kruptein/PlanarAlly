from ..utils import CONFIG_PATH
from .manager import ConfigManager

config_manager = ConfigManager(CONFIG_PATH)
# Re-export for ease of use
config = config_manager.config
