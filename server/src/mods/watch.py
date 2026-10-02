import asyncio

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from ..api.socket.constants import GAME_NS
from ..app import sio
from ..logs import logger
from .dev import configured_roots, dev_signature, load_dev_mods

_observer: Observer | None = None
_loop: asyncio.AbstractEventLoop | None = None
_timer: asyncio.TimerHandle | None = None
_signature: tuple[tuple[str, str], ...] = ()
_tasks: set[asyncio.Task[None]] = set()


class _DevModHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        path = str(event.src_path)
        if "node_modules" in path or "/.git/" in path:
            return
        schedule_dev_mod_broadcast()


def start_dev_mod_watcher() -> None:
    global _observer, _loop, _signature
    if _observer is not None:
        return
    _loop = asyncio.get_running_loop()
    directories = [path for path in configured_roots() if path.is_dir()]
    mods = load_dev_mods()
    _signature = dev_signature(mods)
    if not directories:
        return
    observer = Observer()
    handler = _DevModHandler()
    for directory in directories:
        observer.schedule(handler, str(directory), recursive=True)
        logger.info(f"Watching dev mods in {directory}")
    observer.start()
    _observer = observer
    if mods:
        logger.info("Dev mods: " + ", ".join(mod.tag for mod in mods))


def stop_dev_mod_watcher() -> None:
    global _observer, _timer
    if _timer is not None:
        _timer.cancel()
        _timer = None
    if _observer is not None:
        _observer.stop()
        _observer.join(timeout=2)
        _observer = None


def schedule_dev_mod_broadcast() -> None:
    if _loop is None:
        return
    _loop.call_soon_threadsafe(_arm_timer)


def _arm_timer() -> None:
    global _timer
    if _loop is None:
        return
    if _timer is not None:
        _timer.cancel()
    _timer = _loop.call_later(0.4, _broadcast)


def _broadcast() -> None:
    if _loop is None:
        return
    task = _loop.create_task(publish_dev_mods(force=False))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)


async def publish_dev_mods(*, force: bool) -> None:
    global _signature
    mods = load_dev_mods()
    signature = dev_signature(mods)
    if not force and signature == _signature:
        return
    _signature = signature
    logger.info("Publishing dev mods" + (" (forced)" if force else ""))
    await sio.emit(
        "Mods.Dev.Updated",
        {"mods": [mod.model_dump() for mod in mods], "force": force},
        namespace=GAME_NS,
    )
