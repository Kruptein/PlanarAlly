from typing import TYPE_CHECKING, Callable, Optional, Union, overload

import socketio


class TypedAsyncServer(socketio.AsyncServer):
    def __init__(self, **kwargs):
        super().__init__(async_mode="aiohttp", engineio_logger=False, logger=False, **kwargs)

    if TYPE_CHECKING:

        @overload
        def on(self, event: str, *, namespace: str, handler: None = None) -> Callable: ...

        @overload
        def on(self, event: str, *, namespace: str, handler: Callable) -> None: ...

        def on(self, event: str, *, namespace: str, handler: Optional[Callable] = None) -> Union[Callable, None]: ...
