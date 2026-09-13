from __future__ import annotations

from .base import StorageBackend

_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    assert _backend is not None, "Storage backend not initialised"
    return _backend


def set_storage(backend: StorageBackend) -> None:
    global _backend
    _backend = backend
