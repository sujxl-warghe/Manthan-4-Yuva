from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import (
    Escalation,
    Notification,
    PlantationDrive,
    Tree,
    TreeCategory,
    TreeReplacement,
    TreeReport,
    User,
    Ward,
)
from app.security import get_current_user, require_roles
from app.utils import ok

router = APIRouter(prefix="/api/v1", tags=["admin", "public", "notifications"])


@router.get("/admin/dashboard")
async def admin_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    total = (await db.execute(select(func.count()).select_from(Tree))).scalar() or 0
    dead = (await db.execute(select(func.count()).select_from(Tree).where(Tree.status.in_(["DEAD", "MISSING"])))).scalar() or 0
    at_risk = (await db.execute(select(func.count()).select_from(Tree).where(Tree.risk_level.in_(["HIGH", "CRITICAL"])))).scalar() or 0
    verification_due = (await db.execute(select(func.count()).select_from(Tree).where(Tree.status == "VERIFICATION_DUE"))).scalar() or 0
    open_reports = (await db.execute(select(func.count()).select_from(TreeReport).where(TreeReport.status == "OPEN"))).scalar() or 0
    escalations = (await db.execute(select(func.count()).select_from(Escalation).where(Escalation.status == "OPEN"))).scalar() or 0
    replacement_pending = (
        await db.execute(select(func.count()).select_from(TreeReplacement).where(TreeReplacement.status == "PENDING"))
    ).scalar() or 0
    survival_rate = round(((total - dead) / total) * 100, 1) if total else 0

    return ok(
        {
            "total_trees": total,
            "survival_rate": survival_rate,
            "at_risk": at_risk,
            "verification_due": verification_due,
            "open_reports": open_reports,
            "escalations": escalations,
            "replacement_pending": replacement_pending,
        }
    )


@router.get("/admin/users")
async def admin_users(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN"))):
    rows = (await db.execute(select(User))).scalars().all()
    return ok([{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "is_active": u.is_active} for u in rows])


@router.get("/admin/trees")
async def admin_trees(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    total = (await db.execute(select(func.count()).select_from(Tree))).scalar() or 0
    return ok({"total": total})


@router.get("/admin/reports")
async def admin_reports(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    rows = (await db.execute(select(TreeReport).order_by(TreeReport.created_at.desc()).limit(50))).scalars().all()
    return ok(
        [{"id": r.id, "type": r.type, "status": r.status, "tree_id": r.tree_id, "created_at": r.created_at.isoformat()} for r in rows]
    )


@router.get("/admin/verifications")
async def admin_verifications(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    from app.models.models import TreeVerification

    rows = (
        (await db.execute(select(TreeVerification).order_by(TreeVerification.created_at.desc()).limit(50)))
        .scalars()
        .all()
    )
    return ok([{"id": v.id, "tree_id": v.tree_id, "status": v.status, "created_at": v.created_at.isoformat()} for v in rows])


@router.get("/admin/audits")
async def admin_audits(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    from app.models.models import Audit

    rows = (await db.execute(select(Audit).order_by(Audit.created_at.desc()).limit(50))).scalars().all()
    return ok([{"id": a.id, "tree_id": a.tree_id, "result": a.result} for a in rows])


@router.get("/admin/escalations")
async def admin_escalations(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    rows = (await db.execute(select(Escalation).order_by(Escalation.created_at.desc()).limit(50))).scalars().all()
    return ok([{"id": e.id, "status": e.status, "priority": e.priority, "level": e.level} for e in rows])


@router.get("/admin/replacements")
async def admin_replacements(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("ADMIN", "AUTHORITY"))):
    rows = (await db.execute(select(TreeReplacement))).scalars().all()
    return ok([{"id": r.id, "original_tree_id": r.original_tree_id, "status": r.status} for r in rows])


# ---------- Notifications ----------
@router.get("/notifications")
async def list_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        (await db.execute(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())))
        .scalars()
        .all()
    )
    return ok(
        [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in rows
        ]
    )


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    n = (await db.execute(select(Notification).where(Notification.id == notification_id))).scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return ok({"id": notification_id, "is_read": True})


# ---------- Public ----------
@router.get("/public/statistics")
async def public_statistics(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(Tree))).scalar() or 0
    alive = (
        await db.execute(select(func.count()).select_from(Tree).where(Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"])))
    ).scalar() or 0
    dead = (await db.execute(select(func.count()).select_from(Tree).where(Tree.status.in_(["DEAD", "MISSING"])))).scalar() or 0
    at_risk = (await db.execute(select(func.count()).select_from(Tree).where(Tree.risk_level.in_(["HIGH", "CRITICAL"])))).scalar() or 0
    wards = (await db.execute(select(func.count()).select_from(Ward))).scalar() or 0
    drives = (await db.execute(select(func.count()).select_from(PlantationDrive))).scalar() or 0
    guardians = (await db.execute(select(func.count(func.distinct(Tree.guardian_id))).select_from(Tree))).scalar() or 0
    categories = (await db.execute(select(func.count()).select_from(TreeCategory))).scalar() or 0
    survival_rate = round((alive / total) * 100, 1) if total else 0

    return ok(
        {
            "trees_registered": total,
            "trees_surviving": alive,
            "trees_at_risk": at_risk,
            "dead_missing": dead,
            "tree_guardians": guardians,
            "wards_covered": wards,
            "survival_rate": survival_rate,
            "drives": drives,
            "categories": categories,
        }
    )
