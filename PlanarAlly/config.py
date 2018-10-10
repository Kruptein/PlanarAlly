import configparser

config = configparser.ConfigParser()
config.read("server_config.cfg")


SAVE_FILE = config['General']['save_file']
