from pydantic import Field

from app.schemas.base import CamelModel


class SessionCreate(CamelModel):
    id_token: str = Field(min_length=1, max_length=4096)
