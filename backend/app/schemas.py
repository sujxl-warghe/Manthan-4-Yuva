from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "CITIZEN"
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TreeCreateRequest(BaseModel):
    species_id: str
    category_id: str
    ward_id: str
    institution_id: str | None = None
    drive_id: str | None = None
    guardian_id: str | None = None
    latitude: float
    longitude: float
    address_hint: str | None = None
    plantation_date: datetime | None = None


class TreeUpdateRequest(BaseModel):
    status: str | None = None
    risk_level: str | None = None
    guardian_id: str | None = None
    address_hint: str | None = None


class VerificationCreateRequest(BaseModel):
    photo_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    health_status: str = "HEALTHY"
    watering_status: str = "OK"
    tree_guard_status: str = "OK"
    notes: str | None = None
    checkpoint: str = "ROUTINE"


class ReportCreateRequest(BaseModel):
    tree_id: str | None = None
    type: str
    description: str | None = None
    photo_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class ReportUpdateRequest(BaseModel):
    status: str


class DriveCreateRequest(BaseModel):
    name: str
    description: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    target: int = 0
    ward_id: str | None = None
    institution_id: str | None = None


class AuditCreateRequest(BaseModel):
    tree_id: str
    expected_status: str
    actual_status: str | None = None
    photo_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    notes: str | None = None


class AuditUpdateRequest(BaseModel):
    actual_status: str | None = None
    result: str | None = None
    notes: str | None = None


class EscalationUpdateRequest(BaseModel):
    status: str | None = None
    assigned_to: str | None = None
    priority: str | None = None
