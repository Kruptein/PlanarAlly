from datetime import UTC, datetime

from peewee import DateTimeField


def utc_now() -> datetime:
    return datetime.now(UTC)


class UtcDateTimeField(DateTimeField):
    """DateTime stored as naive UTC. Python values are always timezone-aware UTC.

    SQLite round-trips aware datetimes as strings, so the offset is removed on write
    and attached again on read. A naive value is treated as UTC.
    """

    def db_value(self, value):
        if value is None or not isinstance(value, datetime):
            return super().db_value(value)
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).replace(tzinfo=None)

    def python_value(self, value):
        if isinstance(value, str):
            value = datetime.fromisoformat(value)
        if value is None or not isinstance(value, datetime):
            return value
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
