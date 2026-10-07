from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.errors import error_body
from app.deps import DbSession
from app.schemas.health import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health(db: DbSession):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(error_body("db_unavailable", "資料庫無法連線"), status_code=503)
    return HealthOut(status="ok", database="ok")
