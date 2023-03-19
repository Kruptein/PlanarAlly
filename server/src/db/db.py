from pathlib import Path

from playhouse.sqlite_ext import SqliteExtDatabase

from ..config import SAVE_FILE


def open_db(path: Path) -> SqliteExtDatabase:
    return SqliteExtDatabase(
        path, pragmas={"foreign_keys": 1, "journal_mode": "wal", "synchronous": 0}
    )


def set_db(path: Path):
    from .all import ALL_MODELS

    global db
    db.close()
    db = open_db(path)
    db.bind(ALL_MODELS)
    return db


db = open_db(SAVE_FILE)
