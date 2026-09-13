from __future__ import annotations

from abc import ABC, abstractmethod


class StorageBackend(ABC):
    """Abstract base for asset storage backends (local filesystem, S3, etc.)."""

    @abstractmethod
    async def store(self, file_hash: str, data: bytes, *, suffix: str | None = None) -> None: ...

    @abstractmethod
    async def exists(self, file_hash: str) -> bool: ...

    @abstractmethod
    async def retrieve(self, file_hash: str) -> bytes: ...

    @abstractmethod
    async def delete(self, file_hash: str, *, suffix: str | None = None) -> None:
        """
        Delete the asset with the given hash from storage.
        A suffix can be provided to delete a specific thumbnail of the asset.

        This function should NOT throw an error if the asset or thumbnail does not exist.
        """
        ...

    # SYNC API (used by import/export in threaded context)

    @abstractmethod
    def store_sync(self, file_hash: str, data: bytes, *, suffix: str | None = None) -> None: ...

    @abstractmethod
    def exists_sync(self, file_hash: str) -> bool: ...

    @abstractmethod
    def retrieve_sync(self, file_hash: str) -> bytes: ...

    # HELPERS

    @abstractmethod
    def get_url(self, file_hash: str, *, thumbnail_format: str | None = None) -> str:
        """Return a URL the *frontend* can use to fetch this asset."""
        ...

    @abstractmethod
    def get_public_url_base(self) -> str | None:
        """Return the base URL for asset access.

        ``None`` means "use the default relative path" (local backend).
        A non-None string is an absolute URL prefix (remote backends).
        """
        ...
