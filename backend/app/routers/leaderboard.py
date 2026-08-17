from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Institution, InstitutionTypeEnum, Tree, User, UserPoints, Ward
from app.utils import ok

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])


@router.get("/citizens")
async def citizen_leaderboard(db: AsyncSession = Depends(get_db), limit: int = 20):
    q = (
        select(User.id, User.name, UserPoints.total_points, UserPoints.trees_planted, UserPoints.trees_surviving)
        .join(UserPoints, UserPoints.user_id == User.id)
        .where(User.role == "CITIZEN")
        .order_by(UserPoints.total_points.desc())
        .limit(limit)
    )
    rows = (await db.execute(q)).all()
    return ok(
        [
            {
                "rank": i + 1,
                "user_id": r[0],
                "name": r[1],
                "points": r[2],
                "trees_planted": r[3],
                "trees_surviving": r[4],
            }
            for i, r in enumerate(rows)
        ]
    )


@router.get("/colleges")
async def college_leaderboard(db: AsyncSession = Depends(get_db)):
    rows = (
        (await db.execute(select(Institution).where(Institution.type == InstitutionTypeEnum.COLLEGE)))
        .scalars()
        .all()
    )
    result = []
    for c in rows:
        total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.institution_id == c.id))).scalar() or 0
        alive = (
            await db.execute(
                select(func.count()).select_from(Tree).where(Tree.institution_id == c.id, Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
            )
        ).scalar() or 0
        survival_rate = round((alive / total) * 100, 1) if total else 0
        result.append({"college": c.name, "trees": total, "survival_rate": survival_rate})
    result.sort(key=lambda x: (-x["survival_rate"], -x["trees"]))
    for i, r in enumerate(result):
        r["rank"] = i + 1
    return ok(result)


@router.get("/wards")
async def ward_leaderboard(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Ward))).scalars().all()
    result = []
    for w in rows:
        total = (await db.execute(select(func.count()).select_from(Tree).where(Tree.ward_id == w.id))).scalar() or 0
        alive = (
            await db.execute(
                select(func.count()).select_from(Tree).where(Tree.ward_id == w.id, Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
            )
        ).scalar() or 0
        survival_rate = round((alive / total) * 100, 1) if total else 0
        result.append({"ward": w.name, "trees": total, "survival_rate": survival_rate})
    result.sort(key=lambda x: -x["survival_rate"])
    for i, r in enumerate(result):
        r["rank"] = i + 1
    return ok(result)
