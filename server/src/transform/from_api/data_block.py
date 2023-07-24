from ...api.models.data_block import ApiDataBlock
from ...db.models.data_block import DataBlock
from ...db.models.general_data_block import GeneralDataBlock
from ...db.models.shape_data_block import ShapeDataBlock


def get_data_block(model: ApiDataBlock) -> DataBlock | None:
    if model.category == "general":
        return GeneralDataBlock.get_or_none(source=model.source, name=model.name)
    elif model.category == "shape":
        return ShapeDataBlock.get_or_none(
            source=model.source,
            name=model.name,
            shape=model.shape,
        )
    raise Exception("Unknown db category discovered", model)
