from typing import Annotated

from fastapi import APIRouter, File, Form, Query, Response, UploadFile, status

from app.api.deps import CurrentMember, DbDep, SettingsDep, StorageDep
from app.schemas.common import ErrorOut
from app.schemas.gpx import (
    RouteDetailOut,
    RouteListOut,
    RouteRenameIn,
    RouteSegmentsOut,
)
from app.services import gpx_service

router = APIRouter(prefix="/gpx", tags=["gpx"])

_errors = {401: {"model": ErrorOut}, 404: {"model": ErrorOut}}


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=RouteDetailOut,
    responses={
        401: {"model": ErrorOut},
        409: {"model": ErrorOut},
        413: {"model": ErrorOut},
        415: {"model": ErrorOut},
        422: {"model": ErrorOut},
    },
)
async def upload_gpx(
    member: CurrentMember,
    db: DbDep,
    storage: StorageDep,
    settings: SettingsDep,
    file: Annotated[UploadFile, File(description=".gpx 檔")],
    name: Annotated[str | None, Form(max_length=120)] = None,
) -> RouteDetailOut:
    # 多讀 1 byte 判斷是否超過上限，不把超大檔整個讀進記憶體
    data = await file.read(settings.gpx_max_bytes + 1)
    route = gpx_service.upload_route(
        db,
        storage,
        settings,
        member,
        filename=file.filename,
        content_type=file.content_type,
        data=data,
        name=name,
    )
    return RouteDetailOut.model_validate(route)


@router.get("", response_model=RouteListOut, responses={401: {"model": ErrorOut}})
def list_gpx(
    member: CurrentMember,
    db: DbDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> RouteListOut:
    return gpx_service.list_routes(db, member, limit=limit, offset=offset)


@router.get("/{route_id}", response_model=RouteDetailOut, responses=_errors)
def get_gpx(member: CurrentMember, db: DbDep, route_id: str) -> RouteDetailOut:
    return RouteDetailOut.model_validate(gpx_service.get_route(db, member, route_id))


@router.patch("/{route_id}", response_model=RouteDetailOut, responses=_errors)
def rename_gpx(
    member: CurrentMember, db: DbDep, route_id: str, body: RouteRenameIn
) -> RouteDetailOut:
    return RouteDetailOut.model_validate(gpx_service.rename_route(db, member, route_id, body.name))


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT, responses=_errors)
def delete_gpx(member: CurrentMember, db: DbDep, storage: StorageDep, route_id: str) -> Response:
    gpx_service.delete_route(db, storage, member, route_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{route_id}/segments", response_model=RouteSegmentsOut, responses=_errors)
def get_gpx_segments(member: CurrentMember, db: DbDep, route_id: str) -> RouteSegmentsOut:
    return gpx_service.get_segments(db, member, route_id)
