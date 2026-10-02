from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.route import AnalysisStatus


class RouteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    original_filename: str
    content_type: str
    size_bytes: int
    checksum_sha256: str
    analysis_status: AnalysisStatus
    point_count: int | None
    distance_m: float | None
    elevation_gain_m: float | None
    start_lat: float | None
    start_lng: float | None
    created_at: datetime
    updated_at: datetime


class RouteDetailOut(RouteOut):
    analysis: dict | None


class RouteListOut(BaseModel):
    items: list[RouteOut]
    total: int
    limit: int
    offset: int


class RouteRenameIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("名稱不可為空白")
        return v


class RouteSegmentOut(BaseModel):
    index: int
    start_km: float | None
    end_km: float | None
    county: str | None
    town: str | None
    placeholder: bool


class RouteSegmentsOut(BaseModel):
    route_id: str
    status: str
    segment_length_km: float
    segments: list[RouteSegmentOut]
    note: str
