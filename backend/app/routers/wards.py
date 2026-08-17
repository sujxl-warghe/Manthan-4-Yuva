from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Tree, TreeVerification, Ward
from app.services.scoring import compute_green_score
from app.utils import ok

router = APIRouter(prefix="/api/v1", tags=["wards"])


async def _ward_stats(db: AsyncSession, ward_id: str) -> dict:
    total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.ward_id == ward_id))).scalar() or 0
    alive = (
        await db.execute(
            select(func.count())
            .select_from(Tree)
            .where(Tree.ward_id == ward_id, Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
        )
    ).scalar() or 0
    at_risk = (
        await db.execute(
            select(func.count()).select_from(Tree).where(Tree.ward_id == ward_id, Tree.risk_level.in_(["HIGH", "CRITICAL"]))
        )
    ).scalar() or 0
    dead = (
        await db.execute(
            select(func.count()).select_from(Tree).where(Tree.ward_id == ward_id, Tree.status.in_(["DEAD", "MISSING"]))
        )
    ).scalar() or 0
    verified = (
        await db.execute(
            select(func.count()).select_from(Tree).where(Tree.ward_id == ward_id, Tree.last_verified_at.isnot(None))
        )
    ).scalar() or 0

    survival_rate = round((alive / total) * 100, 1) if total else 0
    verification_rate = round((verified / total) * 100, 1) if total else 0
    return {
        "trees": total,
        "alive": alive,
        "at_risk": at_risk,
        "dead": dead,
        "survival_rate": survival_rate,
        "verification_rate": verification_rate,
    }


@router.get("/wards")
async def list_wards(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Ward))).scalars().all()
    result = []
    for w in rows:
        stats = await _ward_stats(db, w.id)
        result.append({"id": w.id, "name": w.name, "code": w.code, "zone": w.zone, **stats})
    return ok(result)


@router.get("/wards/{ward_id}")
async def get_ward(ward_id: str, db: AsyncSession = Depends(get_db)):
    w = (await db.execute(select(Ward).where(Ward.id == ward_id))).scalar_one_or_none()
    if not w:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Ward not found", "error_code": "WARD_NOT_FOUND"})
    stats = await _ward_stats(db, ward_id)
    return ok({"id": w.id, "name": w.name, "code": w.code, "zone": w.zone, **stats})


@router.get("/wards/{ward_id}/statistics")
async def ward_statistics(ward_id: str, db: AsyncSession = Depends(get_db)):
    stats = await _ward_stats(db, ward_id)
    return ok(stats)


@router.get("/wards/{ward_id}/green-score")
async def ward_green_score(ward_id: str, db: AsyncSession = Depends(get_db)):
    stats = await _ward_stats(db, ward_id)
    score = compute_green_score(stats["survival_rate"], stats["verification_rate"], 80, 70, 75)
    return ok({"ward_id": ward_id, "green_score": score})


@router.get("/green-score")
async def city_green_score(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count()).select_from(Tree))).scalar() or 0
    alive = (
        await db.execute(select(func.count()).select_from(Tree).where(Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"])))
    ).scalar() or 0
    verified = (await db.execute(select(func.count()).select_from(Tree).where(Tree.last_verified_at.isnot(None)))).scalar() or 0
    survival_rate = round((alive / total) * 100, 1) if total else 0
    verification_rate = round((verified / total) * 100, 1) if total else 0
    score = compute_green_score(survival_rate, verification_rate, 78, 66, 72)
    return ok(
        {
            "green_score": score,
            "survival_rate": survival_rate,
            "verification_rate": verification_rate,
            "components": {
                "survival": survival_rate,
                "verification": verification_rate,
                "maintenance": 78,
                "participation": 66,
                "replacement_success": 72,
            },
        }
    )
