import hashlib
import logging
import uuid
from dataclasses import asdict
from pathlib import PurePath

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import (
    ConflictError,
    NotFoundError,
    PayloadTooLargeError,
    UnsupportedMediaTypeError,
    ValidationFailedError,
)
from app.integrations.gpx_analysis import GpxFormatError, ParsedGpx, parse_gpx, segment_route
from app.integrations.storage import ObjectStorage
from app.models.member import Member
from app.models.route import AnalysisStatus, Route
from app.schemas.gpx import RouteListOut, RouteOut, RouteSegmentsOut

logger = logging.getLogger(__name__)

GPX_STORED_CONTENT_TYPE = "application/gpx+xml"


def build_storage_key(member_id: int, route_id: str) -> str:
    return f"gpx/members/{member_id}/{route_id}.gpx"


def _clean_filename(filename: str | None) -> str:
    # 只取檔名本身（瀏覽器可能送出 Windows 路徑）
    name = PurePath((filename or "").replace("\\", "/")).name.strip()
    if not name:
        raise ValidationFailedError("缺少檔名", code="missing_filename")
    return name[:255]


def validate_upload(
    settings: Settings, filename: str | None, content_type: str | None, size: int
) -> str:
    clean = _clean_filename(filename)
    if not clean.lower().endswith(".gpx"):
        raise UnsupportedMediaTypeError("只接受 .gpx 檔案", code="invalid_file_type")
    ct = (content_type or "application/octet-stream").split(";")[0].strip().lower()
    if ct not in settings.gpx_allowed_content_types:
        raise UnsupportedMediaTypeError(f"不支援的 Content-Type：{ct}", code="invalid_content_type")
    if size == 0:
        raise ValidationFailedError("檔案是空的", code="empty_file")
    if size > settings.gpx_max_bytes:
        raise PayloadTooLargeError(
            f"檔案超過上限 {settings.gpx_max_bytes} bytes", code="file_too_large"
        )
    return clean


def _get_owned(db: Session, member: Member, route_id: str) -> Route:
    route = db.get(Route, route_id)
    # 不是自己的也回 404，不透露該 id 是否存在
    if route is None or route.member_id != member.id:
        raise NotFoundError("找不到路線", code="route_not_found")
    return route


def upload_route(
    db: Session,
    storage: ObjectStorage,
    settings: Settings,
    member: Member,
    *,
    filename: str | None,
    content_type: str | None,
    data: bytes,
    name: str | None = None,
) -> Route:
    clean_filename = validate_upload(settings, filename, content_type, len(data))

    owned = db.scalar(select(func.count()).select_from(Route).where(Route.member_id == member.id))
    if owned >= settings.gpx_max_routes_per_member:
        raise ConflictError("已達路線數量上限", code="route_quota_exceeded")

    try:
        parsed: ParsedGpx = parse_gpx(data)
    except GpxFormatError as exc:
        raise ValidationFailedError(str(exc), code="invalid_gpx") from exc
    if parsed.point_count == 0:
        raise ValidationFailedError("GPX 沒有任何 trkpt / rtept", code="invalid_gpx")

    route_id = str(uuid.uuid4())
    display_name = (name or "").strip() or parsed.track_name or PurePath(clean_filename).stem
    route = Route(
        id=route_id,
        member_id=member.id,
        name=display_name[:120],
        original_filename=clean_filename,
        storage_key=build_storage_key(member.id, route_id),
        content_type=GPX_STORED_CONTENT_TYPE,
        size_bytes=len(data),
        checksum_sha256=hashlib.sha256(data).hexdigest(),
        analysis_status=AnalysisStatus.parsed,
        point_count=parsed.point_count,
        distance_m=parsed.distance_m,
        elevation_gain_m=parsed.elevation_gain_m,
        start_lat=parsed.start_lat,
        start_lng=parsed.start_lng,
        analysis=parsed.to_analysis(),
    )

    # 先寫物件再寫 DB；DB 失敗就把物件刪掉，避免孤兒檔
    storage.put(route.storage_key, data, GPX_STORED_CONTENT_TYPE)
    try:
        db.add(route)
        db.commit()
    except Exception:
        db.rollback()
        storage.delete(route.storage_key)
        raise
    db.refresh(route)
    return route


def list_routes(db: Session, member: Member, *, limit: int, offset: int) -> RouteListOut:
    base = select(Route).where(Route.member_id == member.id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(Route.created_at.desc(), Route.id).limit(limit).offset(offset)
    ).all()
    return RouteListOut(
        items=[RouteOut.model_validate(r) for r in rows], total=total, limit=limit, offset=offset
    )


def get_route(db: Session, member: Member, route_id: str) -> Route:
    return _get_owned(db, member, route_id)


def rename_route(db: Session, member: Member, route_id: str, name: str) -> Route:
    route = _get_owned(db, member, route_id)
    route.name = name
    db.commit()
    db.refresh(route)
    return route


def delete_route(db: Session, storage: ObjectStorage, member: Member, route_id: str) -> None:
    route = _get_owned(db, member, route_id)
    key = route.storage_key
    db.delete(route)
    db.commit()
    # DB 已刪除後才刪物件；失敗只記錄，孤兒檔可由排程清理
    try:
        storage.delete(key)
    except Exception:
        logger.exception("刪除物件失敗，留待清理：%s", key)


def get_segments(db: Session, member: Member, route_id: str) -> RouteSegmentsOut:
    route = _get_owned(db, member, route_id)
    parse_info = (route.analysis or {}).get("parse")
    parsed = ParsedGpx(**parse_info) if parse_info else None
    result = segment_route(parsed)
    return RouteSegmentsOut(route_id=route.id, **asdict(result))
