from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    firebase_uid: str
    email: str | None
    email_verified: bool
    display_name: str | None
    photo_url: str | None
    sign_in_provider: str | None
    status: str
    created_at: datetime
    last_login_at: datetime | None


class SessionCreateIn(BaseModel):
    """也可以改用 `Authorization: Bearer <Firebase ID token>`，兩者擇一。"""

    id_token: str | None = Field(default=None, min_length=1)


class SessionOut(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    expires_in: int
    member: MemberOut
