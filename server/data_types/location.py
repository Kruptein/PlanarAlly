from typing_extensions import TypedDict


class LocationOptions(TypedDict):
    pan_x: int
    pan_y: int
    zoom_display: int
    zoom_factor: int
    client_w: int
    client_h: int
