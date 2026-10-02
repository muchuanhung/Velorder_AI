from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.deps import DbDep, SettingsDep
from app.schemas.common import HealthOut, ReadinessOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health(settings: SettingsDep) -> HealthOut:
    """Liveness：程序活著就回 200，不碰外部依賴。"""
    return HealthOut(status="ok", app=settings.app_name, environment=settings.environment)


@router.get("/health/ready", response_model=ReadinessOut, responses={503: {"model": ReadinessOut}})
def readiness(db: DbDep):
    """Readiness：確認 DB 連得上。"""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable", "database": "error"})
    return ReadinessOut(status="ok", database="ok")
