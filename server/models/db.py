from playhouse.sqlite_ext import SqliteExtDatabase
from playhouse.mysql_ext import MySQLConnectorDatabase

from config import SAVE_FILE, DB_TYPE, config

if not DB_TYPE or DB_TYPE == "sqlite":
    db = SqliteExtDatabase(
        SAVE_FILE,
        pragmas={
            # "journal_mode": "wal",
            # "cache_size": -1 * 6400,
            "foreign_keys": 1,
            # "ignore_check_constraints": 0,
            # "synchronous": 0,
        },
    )
elif DB_TYPE == "mysql":
    db = MySQLConnectorDatabase(
            config.get("Database", "db_name"),
            host=config.get("Database", "db_host"),
            port=config.getint("Database", "db_port", fallback=3306),
            user=config.get("Database", "db_user"),
            password=config.get("Database", "db_password", fallback=""),
    )
