"""S3 相容的物件儲存介面。

- LocalObjectStorage：寫本機檔案系統，開發與測試用
- S3ObjectStorage：boto3，可接 MinIO（設 S3_ENDPOINT_URL）或 AWS S3
"""

import re
from pathlib import Path
from typing import Protocol

from app.core.config import Settings

_SAFE_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9/_.\-]*$")


class ObjectNotFoundError(Exception):
    pass


class ObjectStorage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> None: ...
    def get(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...
    def exists(self, key: str) -> bool: ...


def _validate_key(key: str) -> str:
    if not _SAFE_KEY.match(key) or ".." in key.split("/"):
        raise ValueError(f"不合法的 object key：{key!r}")
    return key


class LocalObjectStorage:
    def __init__(self, root: str | Path) -> None:
        self._root = Path(root).resolve()
        self._root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self._root / _validate_key(key)).resolve()
        if self._root not in path.parents:
            raise ValueError(f"object key 超出儲存根目錄：{key!r}")
        return path

    def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_bytes(data)
        tmp.replace(path)

    def get(self, key: str) -> bytes:
        path = self._path(key)
        if not path.exists():
            raise ObjectNotFoundError(key)
        return path.read_bytes()

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)

    def exists(self, key: str) -> bool:
        return self._path(key).exists()


class S3ObjectStorage:
    def __init__(self, settings: Settings, client=None) -> None:
        self._bucket = settings.s3_bucket
        if client is None:
            import boto3

            client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                region_name=settings.s3_region,
                aws_access_key_id=settings.s3_access_key_id,
                aws_secret_access_key=settings.s3_secret_access_key,
            )
        self._client = client

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket, Key=_validate_key(key), Body=data, ContentType=content_type
        )

    def get(self, key: str) -> bytes:
        try:
            obj = self._client.get_object(Bucket=self._bucket, Key=_validate_key(key))
        except self._client.exceptions.NoSuchKey as exc:
            raise ObjectNotFoundError(key) from exc
        return obj["Body"].read()

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=_validate_key(key))

    def exists(self, key: str) -> bool:
        from botocore.exceptions import ClientError

        try:
            self._client.head_object(Bucket=self._bucket, Key=_validate_key(key))
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise
        return True


def build_storage(settings: Settings) -> ObjectStorage:
    if settings.storage_backend == "s3":
        return S3ObjectStorage(settings)
    return LocalObjectStorage(settings.storage_local_root)
