from .data_block import DataBlock


class GeneralDataBlock(DataBlock):
    def as_pydantic(self):
        from ...api.models.data_block import ApiGeneralDataBlock

        return ApiGeneralDataBlock(
            source=self.source,
            name=self.name,
            category="general",
            data=self.data,
        )
