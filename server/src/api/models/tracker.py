from pydantic import Field

from .helpers import TypeIdModel


class TrackerRef(TypeIdModel):
    uuid: str = Field(typeId="TrackerId")
    shape: str = Field(typeId="GlobalId")


class ApiTracker(TrackerRef):
    visible: bool
    name: str
    value: int
    maxvalue: int
    draw: bool
    primary_color: str
    secondary_color: str


class ApiOptionalTracker(TrackerRef):
    visible: bool | None
    name: str | None
    value: int | None
    maxvalue: int | None
    draw: bool | None
    primary_color: str | None
    secondary_color: str | None


class TrackerMove(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    tracker: str = Field(typeId="TrackerId")
    new_shape: str = Field(typeId="GlobalId")


class ShapeSetTrackerValue(TypeIdModel):
    shape: str = Field(typeId="GlobalId")
    value: str = Field(typeId="TrackerId")
