from pydantic import Field
from pydantic.experimental.missing_sentinel import MISSING

from .helpers import TypeIdModel


class TrackerRef(TypeIdModel):
    uuid: str = Field(json_schema_extra={"typeId": "TrackerId"})
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ApiTracker(TrackerRef):
    visible: bool
    name: str
    value: int
    maxvalue: int
    draw: bool
    primary_color: str
    secondary_color: str


class ApiOptionalTracker(TrackerRef):
    visible: bool | MISSING = Field(json_schema_extra={"missing": True})
    name: str | MISSING = Field(json_schema_extra={"missing": True})
    value: int | MISSING = Field(json_schema_extra={"missing": True})
    maxvalue: int | MISSING = Field(json_schema_extra={"missing": True})
    draw: bool | MISSING = Field(json_schema_extra={"missing": True})
    primary_color: str | MISSING = Field(json_schema_extra={"missing": True})
    secondary_color: str | MISSING = Field(json_schema_extra={"missing": True})


class TrackerMove(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    tracker: str = Field(json_schema_extra={"typeId": "TrackerId"})
    new_shape: str = Field(json_schema_extra={"typeId": "GlobalId"})


class ShapeSetTrackerValue(TypeIdModel):
    shape: str = Field(json_schema_extra={"typeId": "GlobalId"})
    value: str = Field(json_schema_extra={"typeId": "TrackerId"})
