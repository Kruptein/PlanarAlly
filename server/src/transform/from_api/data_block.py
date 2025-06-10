from ...api.models.data_block import ApiDataBlock
from ...db.models.data_block import DataBlock
from ...db.models.player_room import PlayerRoom
from ...db.models.room_data_block import RoomDataBlock
from ...db.models.shape_data_block import ShapeDataBlock
from ...db.models.user_data_block import UserDataBlock


def get_data_block(model: ApiDataBlock, pr: PlayerRoom) -> DataBlock | None:
    if model.category == "room":
        return RoomDataBlock.get_or_none(source=model.source, name=model.name, room=pr.room)
    elif model.category == "shape":
        return ShapeDataBlock.get_or_none(
            source=model.source,
            name=model.name,
            shape=model.shape,
        )
    elif model.category == "user":
        return UserDataBlock.get_or_none(source=model.source, name=model.name, user=pr.player)
    raise Exception("Unknown db category discovered", model)
