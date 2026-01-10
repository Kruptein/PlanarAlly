from typing import cast

from peewee import IntegerField, TextField
from playhouse.sqlite_ext import SqliteExtDatabase

from ..base import BaseViewModel


class ShapeRoomView(BaseViewModel):
    shape_id = cast(str, TextField())
    room_id = cast(str | None, TextField(null=True))
    location_id = cast(int | None, IntegerField(null=True))

    @classmethod
    def create_view(cls, db: SqliteExtDatabase):
        db.execute_sql(
            "CREATE VIEW IF NOT EXISTS shape_room_view AS SELECT shape.uuid as shape_id, room.id as room_id, location.id as location_id FROM shape LEFT JOIN layer ON shape.layer_id = layer.id LEFT JOIN floor ON layer.floor_id = floor.id LEFT JOIN location ON floor.location_id = location.id LEFT JOIN room ON location.room_id = room.id"
        )
