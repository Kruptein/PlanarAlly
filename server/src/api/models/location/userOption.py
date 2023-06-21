from ..client import ClientPosition


class ApiLocationUserOption(ClientPosition):
    active_layer: str | None
    active_floor: str | None
