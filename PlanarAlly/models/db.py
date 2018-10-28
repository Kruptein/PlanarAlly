from playhouse.sqlite_ext import SqliteExtDatabase

from config import SAVE_FILE

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
