import io
from datetime import datetime

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Tree, TreeVerification, User
from app.schemas import TreeCreateRequest, TreeUpdateRequest
from app.security import get_current_user, require_roles
from app.services.scoring import compute_risk_level, next_checkpoint
from app.utils import ok, paginated, tree_to_dict, verification_to_dict

router = APIRouter(prefix="/api/v1", tags=["trees"])


def _tree_query():
    return select(Tree).options(
        selectinload(Tree.species),
        selectinload(Tree.category),
        selectinload(Tree.ward),
        selectinload(Tree.institution),
        selectinload(Tree.guardian),
    )


async def _generate_tree_code(db: AsyncSession) -> str:
    year = datetime.utcnow().year
    prefix = f"NGP-{year}-"
    result = await db.execute(select(func.count()).select_from(Tree).where(Tree.tree_code.like(f"{prefix}%")))
    count = result.scalar() or 0
    return f"{prefix}{count + 1:06d}"


@router.post("/trees", status_code=status.HTTP_201_CREATED)
async def create_tree(
    payload: TreeCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION", "CITIZEN")),
):
    if not (-90 <= payload.latitude <= 90) or not (-180 <= payload.longitude <= 180):
        raise HTTPException(
            status_code=422,
            detail={"success": False, "message": "Invalid coordinates", "error_code": "INVALID_COORDS"},
        )
    code = await _generate_tree_code(db)
    tree = Tree(
        tree_code=code,
        species_id=payload.species_id,
        category_id=payload.category_id,
        ward_id=payload.ward_id,
        institution_id=payload.institution_id,
        drive_id=payload.drive_id,
        guardian_id=payload.guardian_id or user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address_hint=payload.address_hint,
        plantation_date=payload.plantation_date or datetime.utcnow(),
    )
    db.add(tree)
    await db.commit()
    q = _tree_query().where(Tree.id == tree.id)
    row = (await db.execute(q)).scalar_one()
    return ok(tree_to_dict(row))


@router.get("/trees")
async def list_trees(
    db: AsyncSession = Depends(get_db),
    species: str | None = None,
    category: str | None = None,
    ward: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    institution: str | None = None,
    drive: str | None = Query(None, alias="plantation_drive"),
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("-created_at"),
):
    q = _tree_query()
    if species:
        q = q.where(Tree.species_id == species)
    if category:
        q = q.where(Tree.category_id == category)
    if ward:
        q = q.where(Tree.ward_id == ward)
    if status_filter:
        q = q.where(Tree.status == status_filter)
    if institution:
        q = q.where(Tree.institution_id == institution)
    if drive:
        q = q.where(Tree.drive_id == drive)
    if search:
        q = q.where(Tree.tree_code.ilike(f"%{search}%"))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    sort_field = sort.lstrip("-")
    sort_col = getattr(Tree, sort_field, Tree.created_at)
    q = q.order_by(sort_col.desc() if sort.startswith("-") else sort_col.asc())
    q = q.offset((page - 1) * page_size).limit(page_size)

    rows = (await db.execute(q)).scalars().all()
    return paginated([tree_to_dict(t) for t in rows], total, page, page_size)


@router.get("/trees/{tree_id}")
async def get_tree(tree_id: str, db: AsyncSession = Depends(get_db)):
    q = _tree_query().where((Tree.id == tree_id) | (Tree.tree_code == tree_id))
    tree = (await db.execute(q)).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    return ok(tree_to_dict(tree))


@router.patch("/trees/{tree_id}")
async def update_tree(
    tree_id: str,
    payload: TreeUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION")),
):
    tree = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(tree, k, v)
    await db.commit()
    q = _tree_query().where(Tree.id == tree_id)
    row = (await db.execute(q)).scalar_one()
    return ok(tree_to_dict(row))


@router.delete("/trees/{tree_id}")
async def delete_tree(
    tree_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN")),
):
    tree = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    await db.delete(tree)
    await db.commit()
    return ok({"deleted": True})


@router.get("/public/trees/{tree_id}/passport")
async def tree_passport(tree_id: str, db: AsyncSession = Depends(get_db)):
    q = _tree_query().where((Tree.id == tree_id) | (Tree.tree_code == tree_id))
    tree = (await db.execute(q)).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    survival_days = (datetime.utcnow() - tree.plantation_date).days
    timeline = next_checkpoint(tree.plantation_date, tree.last_verified_at)
    data = tree_to_dict(tree)
    data.update(
        {
            "survival_days": survival_days,
            "survival_duration_label": f"{survival_days // 365}y {(survival_days % 365) // 30}m"
            if survival_days >= 0
            else "N/A",
            "timeline": timeline["timeline"],
            "next_checkpoint": timeline["next_checkpoint"],
            "qr_url": f"/api/v1/trees/{tree.id}/qr",
        }
    )
    # never expose guardian private contact info on the public passport
    data.pop("guardian_id", None)
    return ok(data)


@router.get("/trees/{tree_id}/qr")
async def tree_qr(tree_id: str, db: AsyncSession = Depends(get_db)):
    tree = (await db.execute(select(Tree).where((Tree.id == tree_id) | (Tree.tree_code == tree_id)))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    url = f"https://vrukshasetu.example.com/trees/{tree.tree_code}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@router.get("/trees/{tree_id}/risk")
async def tree_risk(tree_id: str, db: AsyncSession = Depends(get_db)):
    tree = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    last_v_q = (
        select(TreeVerification)
        .where(TreeVerification.tree_id == tree_id)
        .order_by(TreeVerification.created_at.desc())
        .limit(1)
    )
    last_v = (await db.execute(last_v_q)).scalar_one_or_none()
    risk = compute_risk_level(tree, last_v)
    return ok({"tree_id": tree_id, "risk_level": risk})


@router.get("/trees/{tree_id}/timeline")
async def tree_timeline(tree_id: str, db: AsyncSession = Depends(get_db)):
    tree = (await db.execute(select(Tree).where(Tree.id == tree_id))).scalar_one_or_none()
    if not tree:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Tree not found", "error_code": "TREE_NOT_FOUND"},
        )
    return ok(next_checkpoint(tree.plantation_date, tree.last_verified_at))


@router.get("/map/trees")
async def map_trees(
    db: AsyncSession = Depends(get_db),
    ward: str | None = None,
    species: str | None = None,
    category: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    drive: str | None = None,
):
    q = _tree_query()
    if ward:
        q = q.where(Tree.ward_id == ward)
    if species:
        q = q.where(Tree.species_id == species)
    if category:
        q = q.where(Tree.category_id == category)
    if status_filter:
        q = q.where(Tree.status == status_filter)
    if drive:
        q = q.where(Tree.drive_id == drive)
    rows = (await db.execute(q)).scalars().all()
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [t.longitude, t.latitude]},
            "properties": tree_to_dict(t),
        }
        for t in rows
    ]
    return ok({"type": "FeatureCollection", "features": features})
