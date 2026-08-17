from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Tree, TreeVerification, User, VerificationStatusEnum
from app.schemas import VerificationCreateRequest
from app.security import get_current_user
from app.services.ai_verification import run_ai_verification
from app.services.scoring import compute_risk_level
from app.utils import ok, paginated, verification_to_dict

router = APIRouter(prefix="/api/v1", tags=["verifications"])


@router.post("/trees/{tree_id}/verifications", status_code=201)
async def create_verification(
    tree_id: str,
    payload: VerificationCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tree = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )

    ai_result = run_ai_verification(
        tree_id, payload.latitude, payload.longitude, tree.latitude, tree.longitude, payload.photo_url
    )
    status_map = {
        "VERIFIED": VerificationStatusEnum.VERIFIED,
        "SUSPICIOUS": VerificationStatusEnum.SUSPICIOUS,
        "MANUAL_REVIEW": VerificationStatusEnum.MANUAL_REVIEW,
    }
    v_status = status_map.get(ai_result["verdict"], VerificationStatusEnum.PENDING)

    verification = TreeVerification(
        tree_id=tree_id,
        verified_by=user.id,
        photo_url=payload.photo_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        health_status=payload.health_status,
        watering_status=payload.watering_status,
        tree_guard_status=payload.tree_guard_status,
        notes=payload.notes,
        checkpoint=payload.checkpoint,
        status=v_status,
        ai_confidence=ai_result["confidence"],
    )
    db.add(verification)

    if v_status == VerificationStatusEnum.VERIFIED:
        tree.last_verified_at = datetime.utcnow()
        if payload.health_status == "HEALTHY":
            tree.status = "HEALTHY"
    tree.risk_level = compute_risk_level(tree, verification)

    await db.commit()
    result = verification_to_dict(verification)
    result["ai_verification"] = ai_result
    return ok(result)


@router.get("/trees/{tree_id}/verifications")
async def list_tree_verifications(tree_id: str, db: AsyncSession = Depends(get_db)):
    rows = (
        (
            await db.execute(
                select(TreeVerification)
                .where(TreeVerification.tree_id == tree_id)
                .order_by(TreeVerification.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return ok([verification_to_dict(v) for v in rows])


@router.get("/verifications")
async def list_verifications(
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = select(TreeVerification)
    if status_filter:
        q = q.where(TreeVerification.status == status_filter)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(TreeVerification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return paginated([verification_to_dict(v) for v in rows], total, page, page_size)


@router.get("/verifications/{verification_id}")
async def get_verification(verification_id: str, db: AsyncSession = Depends(get_db)):
    v = (
        await db.execute(select(TreeVerification).where(TreeVerification.id == verification_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Verification not found", "error_code": "VERIFICATION_NOT_FOUND"},
        )
    return ok(verification_to_dict(v))
