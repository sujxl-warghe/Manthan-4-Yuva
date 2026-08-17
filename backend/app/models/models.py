import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CITIZEN = "CITIZEN"
    ADMIN = "ADMIN"
    AUTHORITY = "AUTHORITY"
    INSTITUTION = "INSTITUTION"
    NGO = "NGO"
    CSR = "CSR"


class TreeStatusEnum(str, enum.Enum):
    HEALTHY = "HEALTHY"
    AT_RISK = "AT_RISK"
    VERIFICATION_DUE = "VERIFICATION_DUE"
    DEAD = "DEAD"
    MISSING = "MISSING"
    REPLACED = "REPLACED"


class VerificationStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    SUSPICIOUS = "SUSPICIOUS"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class ReportTypeEnum(str, enum.Enum):
    DEAD = "DEAD"
    MISSING = "MISSING"
    NEEDS_WATER = "NEEDS_WATER"
    DAMAGED = "DAMAGED"
    BROKEN_GUARD = "BROKEN_GUARD"
    ANIMAL_DAMAGE = "ANIMAL_DAMAGE"
    DISEASE = "DISEASE"
    ENCROACHMENT = "ENCROACHMENT"
    OTHER = "OTHER"


class ReportStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InstitutionTypeEnum(str, enum.Enum):
    COLLEGE = "COLLEGE"
    NGO = "NGO"
    CSR = "CSR"
    GOVERNMENT = "GOVERNMENT"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.CITIZEN)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    institution_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=True
    )
    ward_id: Mapped[str | None] = mapped_column(String, ForeignKey("wards.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")
    trees_guarded = relationship("Tree", back_populates="guardian", foreign_keys="Tree.guardian_id")
    points = relationship("UserPoints", back_populates="user", uselist=False)


class Ward(Base):
    __tablename__ = "wards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    zone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    centroid_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    centroid_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    trees = relationship("Tree", back_populates="ward")


class Species(Base):
    __tablename__ = "species"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    scientific_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    category_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("tree_categories.id"), nullable=True
    )

    category = relationship("TreeCategory", back_populates="species_list")
    trees = relationship("Tree", back_populates="species")


class TreeCategory(Base):
    __tablename__ = "tree_categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(80), unique=True)  # Fruit, Native, Medicinal...

    species_list = relationship("Species", back_populates="category")
    trees = relationship("Tree", back_populates="category")


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[InstitutionTypeEnum] = mapped_column(Enum(InstitutionTypeEnum))
    ward_id: Mapped[str | None] = mapped_column(String, ForeignKey("wards.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    trees = relationship("Tree", back_populates="institution")


class PlantationDrive(Base):
    __tablename__ = "plantation_drives"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    target: Mapped[int] = mapped_column(Integer, default=0)
    ward_id: Mapped[str | None] = mapped_column(String, ForeignKey("wards.id"), nullable=True)
    institution_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")

    trees = relationship("Tree", back_populates="drive")


class Tree(Base):
    __tablename__ = "trees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)  # NGP-2026-000421
    species_id: Mapped[str] = mapped_column(String, ForeignKey("species.id"), index=True)
    category_id: Mapped[str] = mapped_column(String, ForeignKey("tree_categories.id"), index=True)
    ward_id: Mapped[str] = mapped_column(String, ForeignKey("wards.id"), index=True)
    institution_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=True
    )
    drive_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("plantation_drives.id"), nullable=True
    )
    guardian_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)

    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    address_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)

    plantation_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[TreeStatusEnum] = mapped_column(
        Enum(TreeStatusEnum), default=TreeStatusEnum.HEALTHY, index=True
    )
    risk_level: Mapped[RiskLevelEnum] = mapped_column(Enum(RiskLevelEnum), default=RiskLevelEnum.LOW)

    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    parent_tree_id: Mapped[str | None] = mapped_column(String, ForeignKey("trees.id"), nullable=True)
    replacement_generation: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    species = relationship("Species", back_populates="trees")
    category = relationship("TreeCategory", back_populates="trees")
    ward = relationship("Ward", back_populates="trees")
    institution = relationship("Institution", back_populates="trees")
    drive = relationship("PlantationDrive", back_populates="trees")
    guardian = relationship("User", back_populates="trees_guarded", foreign_keys=[guardian_id])
    verifications = relationship(
        "TreeVerification", back_populates="tree", order_by="TreeVerification.created_at"
    )
    reports = relationship("TreeReport", back_populates="tree")
    replacements = relationship(
        "TreeReplacement", back_populates="original_tree", foreign_keys="TreeReplacement.original_tree_id"
    )


class TreeVerification(Base):
    __tablename__ = "tree_verifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_id: Mapped[str] = mapped_column(String, ForeignKey("trees.id"), index=True)
    verified_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    health_status: Mapped[str] = mapped_column(String(30), default="HEALTHY")
    watering_status: Mapped[str] = mapped_column(String(30), default="OK")
    tree_guard_status: Mapped[str] = mapped_column(String(30), default="OK")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    checkpoint: Mapped[str] = mapped_column(String(20), default="ROUTINE")  # 1_MONTH,6_MONTHS,1_YEAR,3_YEARS,ROUTINE
    status: Mapped[VerificationStatusEnum] = mapped_column(
        Enum(VerificationStatusEnum), default=VerificationStatusEnum.VERIFIED, index=True
    )
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    tree = relationship("Tree", back_populates="verifications")


class TreeReport(Base):
    __tablename__ = "tree_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_id: Mapped[str | None] = mapped_column(String, ForeignKey("trees.id"), nullable=True, index=True)
    reported_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    type: Mapped[ReportTypeEnum] = mapped_column(Enum(ReportTypeEnum))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[ReportStatusEnum] = mapped_column(
        Enum(ReportStatusEnum), default=ReportStatusEnum.OPEN, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    tree = relationship("Tree", back_populates="reports")


class TreeMaintenance(Base):
    __tablename__ = "tree_maintenance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_id: Mapped[str] = mapped_column(String, ForeignKey("trees.id"), index=True)
    performed_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    activity: Mapped[str] = mapped_column(String(100))  # Watering, Pruning, Guard Repair...
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TreeReplacement(Base):
    __tablename__ = "tree_replacements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    original_tree_id: Mapped[str] = mapped_column(String, ForeignKey("trees.id"), index=True)
    replacement_tree_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("trees.id"), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    original_tree = relationship("Tree", foreign_keys=[original_tree_id], back_populates="replacements")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    achievement_id: Mapped[str] = mapped_column(String, ForeignKey("achievements.id"))
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UserPoints(Base):
    __tablename__ = "user_points"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    trees_planted: Mapped[int] = mapped_column(Integer, default=0)
    trees_verified: Mapped[int] = mapped_column(Integer, default=0)
    trees_surviving: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", back_populates="points")


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_id: Mapped[str] = mapped_column(String, ForeignKey("trees.id"), index=True)
    auditor_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    expected_status: Mapped[str] = mapped_column(String(30))
    actual_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    result: Mapped[str] = mapped_column(String(30), default="PENDING")  # MATCH, MISMATCH, PENDING
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    tree_id: Mapped[str | None] = mapped_column(String, ForeignKey("trees.id"), nullable=True)
    report_id: Mapped[str | None] = mapped_column(String, ForeignKey("tree_reports.id"), nullable=True)
    level: Mapped[str] = mapped_column(String(30), default="GUARDIAN")  # GUARDIAN,SUPERVISOR,INSTITUTION,AUTHORITY
    assigned_to: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(30), default="OPEN")
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class CSROrganization(Base):
    __tablename__ = "csr_organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(200))
    trees_supported: Mapped[int] = mapped_column(Integer, default=0)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


Index("ix_trees_status_ward", Tree.status, Tree.ward_id)
