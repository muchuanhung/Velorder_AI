from pydantic import BaseModel


class ErrorOut(BaseModel):
    code: str
    message: str


class HealthOut(BaseModel):
    status: str
    app: str
    environment: str


class ReadinessOut(BaseModel):
    status: str
    database: str
