from fastapi import APIRouter

from app.deps import CurrentMember
from app.schemas.member import MemberOut

router = APIRouter(prefix="/api/v1", tags=["me"])


@router.get("/me", response_model=MemberOut)
def get_me(member: CurrentMember):
    return member
