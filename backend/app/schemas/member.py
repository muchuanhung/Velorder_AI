from app.schemas.base import CamelModel, UtcDatetime


class MemberOut(CamelModel):
    """不回傳內部流水號 id。"""

    email: str | None
    display_name: str | None
    created_at: UtcDatetime
    last_login_at: UtcDatetime
