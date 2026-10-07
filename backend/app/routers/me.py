from fastapi import APIRouter

from app.deps import CurrentUser
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/v1", tags=["me"])


@router.get("/me", response_model=UserOut)
def get_me(user: CurrentUser):
    return user
