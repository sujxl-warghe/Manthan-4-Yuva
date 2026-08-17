from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Audit, PlantationDrive, Tree, TreeReplacement, User
from app.schemas import AuditCreateRequest, AuditUpdateRequest, DriveCreateRequest
from app.security import get_current_user, require_roles
from app.utils import ok, paginated, tree_to_dict

router = APIRouter(prefix="/api/v1", tags=["operations"])


# ---------- Replacement ----------
@router.post("/trees/{tree_id}/replacement", status_code=201)
async def create_replacement(
    tree_id: str,
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION")),
):
    original = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not original:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    original.status = "DEAD"

    gen = (original.replacement_generation or 0) + 1
    new_code = f"{original.tree_code}-R{gen}"
    new_tree = Tree(
        tree_code=new_code,
        species_id=original.species_id,
        category_id=original.category_id,
        ward_id=original.ward_id,
        institution_id=original.institution_id,
        drive_id=original.drive_id,
        guardian_id=original.guardian_id,
        latitude=original.latitude,
        longitude=original.longitude,
        address_hint=original.address_hint,
        plantation_date=datetime.utcnow(),
        parent_tree_id=original.id,
        replacement_generation=gen,
    )
    db.add(new_tree)
    await db.flush()

    replacement = TreeReplacement(
        original_tree_id=original.id,
        replacement_tree_id=new_tree.id,
        reason=reason,
        status="COMPLETED",
    )
    db.add(replacement)
    await db.commit()

    reloaded_q = (
        select(Tree)
        .options(
            selectinload(Tree.species),
            selectinload(Tree.category),
            selectinload(Tree.ward),
            selectinload(Tree.institution),
            selectinload(Tree.guardian),
        )
        .where(Tree.id == original.id)
    )
    reloaded = (await db.execute(reloaded_q)).scalar_one()
    return ok(
        {
            "original_tree": tree_to_dict(reloaded),
            "replacement_tree": {"id": new_tree.id, "tree_code": new_tree.tree_code},
        }
    )


@router.get("/trees/{tree_id}/replacements")
async def list_replacements(tree_id: str, db: AsyncSession = Depends(get_db)):
    rows = (
        (await db.execute(select(TreeReplacement).where(TreeReplacement.original_tree_id == tree_id)))
        .scalars()
        .all()
    )
    return ok(
        [
            {
                "id": r.id,
                "original_tree_id": r.original_tree_id,
                "replacement_tree_id": r.replacement_tree_id,
                "reason": r.reason,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    )


# ---------- Plantation Drives ----------
@router.post("/drives", status_code=201)
async def create_drive(
    payload: DriveCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION")),
):
    drive = PlantationDrive(**payload.model_dump())
    db.add(drive)
    await db.commit()
    return ok({"id": drive.id, "name": drive.name})


@router.get("/drives")
async def list_drives(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(PlantationDrive))).scalars().all()
    result = []
    for d in rows:
        trees_q = select(func.count()).select_from(Tree).where(Tree.drive_id == d.id)
        planted = (await db.execute(trees_q)).scalar() or 0
        alive_q = trees_q.where(Tree.status.in_(["HEALTHY", "AT_RISK", "VERIFICATION_DUE"]))
        surviving = (await db.execute(alive_q)).scalar() or 0
        result.append(
            {
                "id": d.id,
                "name": d.name,
                "description": d.description,
                "start_date": d.start_date.isoformat() if d.start_date else None,
                "end_date": d.end_date.isoformat() if d.end_date else None,
                "target": d.target,
                "planted": planted,
                "surviving": surviving,
                "survival_rate": round((surviving / planted) * 100, 1) if planted else 0,
                "ward_id": d.ward_id,
                "institution_id": d.institution_id,
                "status": d.status,
            }
        )
    return ok(result)


@router.get("/drives/{drive_id}")
async def get_drive(drive_id: str, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(PlantationDrive).where(PlantationDrive.id == drive_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Drive not found", "error_code": "DRIVE_NOT_FOUND"},
        )
    planted = (await db.execute(select(func.count()).select_from(Tree).where(Tree.drive_id == d.id))).scalar() or 0
    return ok(
        {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "target": d.target,
            "planted": planted,
            "status": d.status,
        }
    )


@router.patch("/drives/{drive_id}")
async def update_drive(
    drive_id: str,
    status_value: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY")),
):
    d = (await db.execute(select(PlantationDrive).where(PlantationDrive.id == drive_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Drive not found", "error_code": "DRIVE_NOT_FOUND"},
        )
    if status_value:
        d.status = status_value
    await db.commit()
    return ok({"id": d.id, "status": d.status})


# ---------- Audits ----------
@router.post("/audits", status_code=201)
async def create_audit(
    payload: AuditCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY")),
):
    result = "MATCH" if payload.actual_status == payload.expected_status else "PENDING"
    if payload.actual_status and payload.actual_status != payload.expected_status:
        result = "MISMATCH"
    audit = Audit(
        tree_id=payload.tree_id,
        auditor_id=user.id,
        expected_status=payload.expected_status,
        actual_status=payload.actual_status,
        photo_url=payload.photo_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        notes=payload.notes,
        result=result,
    )
    db.add(audit)
    await db.commit()
    return ok({"id": audit.id, "result": audit.result})


@router.get("/audits")
async def list_audits(
    db: AsyncSession = Depends(get_db),
    result_filter: str | None = Query(None, alias="result"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = select(Audit)
    if result_filter:
        q = q.where(Audit.result == result_filter)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(Audit.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    data = [
        {
            "id": a.id,
            "tree_id": a.tree_id,
            "auditor_id": a.auditor_id,
            "expected_status": a.expected_status,
            "actual_status": a.actual_status,
            "result": a.result,
            "notes": a.notes,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]
    return paginated(data, total, page, page_size)


@router.patch("/audits/{audit_id}")
async def update_audit(
    audit_id: str,
    payload: AuditUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY")),
):
    a = (await db.execute(select(Audit).where(Audit.id == audit_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Audit not found", "error_code": "AUDIT_NOT_FOUND"},
        )
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(a, k, v)
    await db.commit()
    return ok({"id": a.id, "result": a.result})
