from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import (
    Species,
    Tree,
    TreeCategory,
    TreeReplacement,
    TreeVerification,
    Ward,
)
from app.utils import ok

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(Tree))).scalar() or 0
    healthy = (await db.execute(select(func.count()).select_from(Tree).where(Tree.status == "HEALTHY"))).scalar() or 0
    at_risk = (await db.execute(select(func.count()).select_from(Tree).where(Tree.status == "AT_RISK"))).scalar() or 0
    verification_due = (
        await db.execute(select(func.count()).select_from(Tree).where(Tree.status == "VERIFICATION_DUE"))
    ).scalar() or 0
    dead = (
        await db.execute(select(func.count()).select_from(Tree).where(Tree.status.in_(["DEAD", "MISSING"])))
    ).scalar() or 0
    guardians = (
        await db.execute(select(func.count(func.distinct(Tree.guardian_id))).select_from(Tree))
    ).scalar() or 0
    wards_covered = (await db.execute(select(func.count(func.distinct(Tree.ward_id))).select_from(Tree))).scalar() or 0
    survival_rate = round(((total - dead) / total) * 100, 1) if total else 0

    return ok(
        {
            "total_trees": total,
            "healthy": healthy,
            "at_risk": at_risk,
            "verification_due": verification_due,
            "dead_missing": dead,
            "guardians": guardians,
            "wards_covered": wards_covered,
            "survival_rate": survival_rate,
        }
    )


@router.get("/survival")
async def survival_trend(db: AsyncSession = Depends(get_db)):
    # Monthly plantation vs alive count trend, last 12 months
    months = []
    now = datetime.utcnow().replace(day=1)
    for i in range(11, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(day=1)
        months.append(month_start)

    result = []
    for i, m_start in enumerate(months):
        m_end = months[i + 1] if i + 1 < len(months) else datetime.utcnow()
        planted_q = select(func.count()).select_from(Tree).where(
            Tree.plantation_date >= m_start, Tree.plantation_date < m_end
        )
        planted = (await db.execute(planted_q)).scalar() or 0
        alive_q = planted_q.where(Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
        alive = (await db.execute(alive_q)).scalar() or 0
        result.append(
            {
                "month": m_start.strftime("%b %Y"),
                "planted": planted,
                "surviving": alive,
                "survival_rate": round((alive / planted) * 100, 1) if planted else 0,
            }
        )
    return ok(result)


@router.get("/wards")
async def wards_analytics(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Ward))).scalars().all()
    result = []
    for w in rows:
        total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.ward_id == w.id))).scalar() or 0
        alive = (
            await db.execute(
                select(func.count()).select_from(Tree).where(Tree.ward_id == w.id, Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
            )
        ).scalar() or 0
        result.append({"ward": w.name, "total": total, "survival_rate": round((alive / total) * 100, 1) if total else 0})
    return ok(sorted(result, key=lambda x: -x["survival_rate"]))


@router.get("/species")
async def species_analytics(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Species))).scalars().all()
    result = []
    for s in rows:
        total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.species_id == s.id))).scalar() or 0
        if total == 0:
            continue
        alive = (
            await db.execute(
                select(func.count()).select_from(Tree).where(Tree.species_id == s.id, Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
            )
        ).scalar() or 0
        result.append({"species": s.name, "total": total, "survival_rate": round((alive / total) * 100, 1)})
    return ok(sorted(result, key=lambda x: -x["total"]))


@router.get("/categories")
async def categories_analytics(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(TreeCategory))).scalars().all()
    result = []
    for c in rows:
        total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.category_id == c.id))).scalar() or 0
        result.append({"category": c.name, "total": total})
    return ok(result)


@router.get("/verification")
async def verification_analytics(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(TreeVerification))).scalar() or 0
    by_status = {}
    for s in ("VERIFIED", "PENDING", "FAILED", "SUSPICIOUS", "MANUAL_REVIEW"):
        c = (await db.execute(select(func.count()).select_from(TreeVerification).where(TreeVerification.status == s))).scalar() or 0
        by_status[s] = c
    return ok({"total": total, "by_status": by_status})


@router.get("/replacements")
async def replacements_analytics(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(TreeReplacement))).scalar() or 0
    completed = (
        await db.execute(select(func.count()).select_from(TreeReplacement).where(TreeReplacement.status == "COMPLETED"))
    ).scalar() or 0
    return ok({"total": total, "completed": completed, "success_rate": round((completed / total) * 100, 1) if total else 0})
