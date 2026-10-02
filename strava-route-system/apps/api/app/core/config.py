"""應用程式設定：全部由環境變數（或 .env）讀入，不在程式碼內放任何密鑰。"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_ONLY_JWT_SECRET = "local-dev-only-jwt-secret-do-not-use-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Routecast API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # 例：mysql+pymysql://routecast:routecast@localhost:3306/routecast?charset=utf8mb4
    database_url: str = "sqlite:///./routecast-dev.db"

    # firebase：正式驗證 Firebase ID token；fake：本機開發用，token 格式 `fake:<uid>[:<email>]`
    auth_provider: Literal["firebase", "fake"] = "firebase"
    firebase_project_id: str | None = None
    # service account JSON 字串（與 web 的 FIREBASE_SERVICE_ACCOUNT_JSON 相同格式）
    firebase_service_account_json: str | None = None

    # 本 API 自行簽發的 session JWT
    session_jwt_secret: str = DEV_ONLY_JWT_SECRET
    session_jwt_issuer: str = "routecast-api"
    session_jwt_audience: str = "routecast-web"
    session_ttl_seconds: int = 60 * 60 * 24 * 7

    storage_backend: Literal["local", "s3"] = "local"
    storage_local_root: str = "./.data/objects"
    s3_bucket: str = "routecast-gpx"
    s3_endpoint_url: str | None = None  # MinIO：http://minio:9000；AWS 留空
    s3_region: str = "ap-northeast-1"
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None

    gpx_max_bytes: int = 10 * 1024 * 1024
    gpx_allowed_content_types: list[str] = Field(
        default_factory=lambda: [
            "application/gpx+xml",
            "application/xml",
            "text/xml",
            "application/octet-stream",
        ]
    )
    gpx_max_routes_per_member: int = 200

    @model_validator(mode="after")
    def _guard_production(self) -> "Settings":
        if not self.session_jwt_secret:
            raise ValueError("SESSION_JWT_SECRET 不可為空")
        if self.environment == "production":
            if self.auth_provider == "fake":
                raise ValueError("production 環境禁止使用 fake 驗證")
            if self.session_jwt_secret == DEV_ONLY_JWT_SECRET or len(self.session_jwt_secret) < 32:
                raise ValueError("production 環境必須設定長度 >= 32 的 SESSION_JWT_SECRET")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
