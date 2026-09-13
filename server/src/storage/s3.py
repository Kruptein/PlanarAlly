"""
S3-compatible storage backend

Implements AWS Signature V4 signing from scratch so no extra packages are needed.
(and our docker setup does not become more complicated with optional dependencies)
Works with AWS S3, DigitalOcean Spaces, Backblaze B2, MinIO, and other S3-compatible services.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import aiohttp

from ..utils import get_asset_hash_subpath
from .base import StorageBackend

if TYPE_CHECKING:
    from ..config.types import S3StorageConfig

EMPTY_HASH = hashlib.sha256(b"").hexdigest()
UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD"


def sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def get_signing_key(secret_key: str, date_stamp: str, region: str, service: str = "s3") -> bytes:
    k_date = sign(f"AWS4{secret_key}".encode(), date_stamp)
    k_region = sign(k_date, region)
    k_service = sign(k_region, service)
    return sign(k_service, "aws4_request")


def build_auth_headers(
    *,
    method: str,
    path: str,
    query: str,
    headers: dict[str, str],
    payload_hash: str,
    region: str,
    access_key: str,
    secret_key: str,
    service: str = "s3",
) -> dict[str, str]:
    now = datetime.now(UTC)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")

    headers = {k.lower(): v for k, v in headers.items()}
    headers["x-amz-date"] = amz_date
    headers["x-amz-content-sha256"] = payload_hash

    signed_header_keys = sorted(headers.keys())
    signed_headers_str = ";".join(signed_header_keys)

    canonical_headers = "".join(f"{k}:{headers[k]}\n" for k in signed_header_keys)

    canonical_request = "\n".join(
        [
            method,
            urllib.parse.quote(path, safe="/"),
            query,
            canonical_headers,
            signed_headers_str,
            payload_hash,
        ]
    )

    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        [
            "AWS4-HMAC-SHA256",
            amz_date,
            credential_scope,
            hashlib.sha256(canonical_request.encode()).hexdigest(),
        ]
    )

    signing_key = get_signing_key(secret_key, date_stamp, region, service)
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()

    headers["authorization"] = (
        f"AWS4-HMAC-SHA256 "
        f"Credential={access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers_str}, "
        f"Signature={signature}"
    )

    return headers


class S3StorageBackend(StorageBackend):
    def __init__(self, config: S3StorageConfig) -> None:
        self.bucket = config.bucket
        self.region = config.region
        self.prefix = config.prefix or ""

        self.access_key = os.environ.get("PA_S3_ACCESS_KEY", "")
        self.secret_key = os.environ.get("PA_S3_SECRET_KEY", "")
        if not self.access_key or not self.secret_key:
            raise ValueError("S3 storage requires PA_S3_ACCESS_KEY and PA_S3_SECRET_KEY environment variables")

        if config.endpoint_url:
            # S3-compatible service (path-style)
            self._api_base = config.endpoint_url.rstrip("/")
            self._path_style = True
        else:
            # Standard AWS (virtual-hosted style)
            self._api_base = f"https://{self.bucket}.s3.{self.region}.amazonaws.com"
            self._path_style = False

        if config.public_url:
            self._public_base = config.public_url.rstrip("/")
        else:
            self._public_base = self._api_base
            if self._path_style:
                self._public_base += f"/{self.bucket}"

        self._session: aiohttp.ClientSession | None = None

    def get_signed_headers(
        self,
        method: str,
        path: str,
        *,
        payload_hash: str = EMPTY_HASH,
        extra_headers: dict[str, str] | None = None,
    ) -> dict[str, str]:
        url_parts = urllib.parse.urlparse(self._api_base)
        headers: dict[str, str] = {"host": url_parts.netloc}
        if extra_headers:
            headers.update(extra_headers)
        return build_auth_headers(
            method=method,
            path=path,
            query="",
            headers=headers,
            payload_hash=payload_hash,
            region=self.region,
            access_key=self.access_key,
            secret_key=self.secret_key,
        )

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def _put(self, key: str, data: bytes) -> None:
        url, path = self.get_url_and_path(key)
        payload_hash = hashlib.sha256(data).hexdigest()
        headers = self.get_signed_headers("PUT", path, payload_hash=payload_hash)
        session = await self._get_session()
        async with session.put(url, data=data, headers=headers) as resp:
            if resp.status >= 300:
                body = await resp.text()
                raise RuntimeError(f"S3 PUT {url} failed ({resp.status}): {body}")

    async def store(self, file_hash: str, data: bytes, *, suffix: str | None = None) -> None:
        await self._put(self.get_key(file_hash, suffix), data)

    async def exists(self, file_hash: str) -> bool:
        url, path = self.get_url_and_path(self.get_key(file_hash))
        headers = self.get_signed_headers("HEAD", path)
        session = await self._get_session()
        async with session.head(url, headers=headers) as resp:
            return resp.status == 200

    async def retrieve(self, file_hash: str) -> bytes:
        url, path = self.get_url_and_path(self.get_key(file_hash))
        headers = self.get_signed_headers("GET", path)
        session = await self._get_session()
        async with session.get(url, headers=headers) as resp:
            if resp.status >= 300:
                body = await resp.text()
                raise RuntimeError(f"S3 GET {url} failed ({resp.status}): {body}")
            return await resp.read()

    async def delete(self, file_hash: str, *, suffix: str | None = None) -> None:
        url, path = self.get_url_and_path(self.get_key(file_hash, suffix))
        headers = self.get_signed_headers("DELETE", path)
        session = await self._get_session()
        async with session.delete(url, headers=headers) as resp:
            if resp.status >= 300 and resp.status != 404:
                body = await resp.text()
                raise RuntimeError(f"S3 DELETE {url} failed ({resp.status}): {body}")

    def _put_sync(self, key: str, data: bytes) -> None:
        url, path = self.get_url_and_path(key)
        payload_hash = hashlib.sha256(data).hexdigest()
        headers = self.get_signed_headers("PUT", path, payload_hash=payload_hash)
        req = urllib.request.Request(url, data=data, headers=headers, method="PUT")
        with urllib.request.urlopen(req) as resp:
            if resp.status >= 300:
                raise RuntimeError(f"S3 PUT {url} failed ({resp.status})")

    def store_sync(self, file_hash: str, data: bytes, *, suffix: str | None = None) -> None:
        self._put_sync(self.get_key(file_hash, suffix), data)

    def exists_sync(self, file_hash: str) -> bool:
        url, path = self.get_url_and_path(self.get_key(file_hash))
        headers = self.get_signed_headers("HEAD", path)
        req = urllib.request.Request(url, headers=headers, method="HEAD")
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status == 200
        except urllib.error.HTTPError:
            return False

    def retrieve_sync(self, file_hash: str) -> bytes:
        url, path = self.get_url_and_path(self.get_key(file_hash))
        headers = self.get_signed_headers("GET", path)
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req) as resp:
            return resp.read()

    def get_key(self, file_hash: str, suffix: str | None = None) -> str:
        sub = str(get_asset_hash_subpath(file_hash))
        if suffix:
            sub = f"{sub}{suffix}"
        return f"{self.prefix}/{sub}" if self.prefix else sub

    def get_url_and_path(self, key: str) -> tuple[str, str]:
        if self._path_style:
            path = f"/{self.bucket}/{key}"
        else:
            path = f"/{key}"
        return f"{self._api_base}{path}", path

    def get_url(self, file_hash: str, *, thumbnail_format: str | None = None) -> str:
        sub = str(get_asset_hash_subpath(file_hash))
        key = f"{self.prefix}/{sub}" if self.prefix else sub
        if thumbnail_format is not None:
            key = f"{key}.thumb.{thumbnail_format}"
        return f"{self._public_base}/{key}"

    def get_public_url_base(self) -> str | None:
        if self.prefix:
            return f"{self._public_base}/{self.prefix}"
        return self._public_base
